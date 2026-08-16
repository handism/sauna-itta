require "test_helper"

class ApiV1SaunaVisitsTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "未認証では一覧を取得できない" do
    get "/api/v1/sauna_visits"
    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")
  end

  test "未認証では記録の作成・更新・削除ができない" do
    get "/api/v1/session"
    csrf = response.parsed_body.fetch("csrfToken")

    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")

    patch "/api/v1/sauna_visits/some-id", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")

    delete "/api/v1/sauna_visits/some-id", headers: csrf_header(csrf)
    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")
  end

  test "セッションは認証状態とCSRFトークンを返す" do
    sign_in
    get "/api/v1/session"

    assert_response :success
    assert response.parsed_body["authenticated"]
    assert_equal "owner@example.com", response.parsed_body.dig("user", "email")
    assert response.parsed_body["csrfToken"].present?
  end

  test "許可外Googleアカウントではセッションを作らない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(uid: "denied", email: "denied@example.com")
    get "/auth/google_oauth2/callback"
    assert_response :redirect
    get "/api/v1/session"
    assert_not response.parsed_body["authenticated"]
  end

  test "変更系APIはCSRFトークンを必須にする" do
    sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes }, as: :json

    assert_response :unprocessable_content
    assert_equal "invalid_csrf", response.parsed_body.dig("error", "code")
  end

  test "新規サウナ訪問記録を正しく作成できる" do
    csrf = sign_in
    assert_difference -> { SaunaVisit.count } => 1, -> { VisitHistoryEntry.count } => 1 do
      post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
        headers: csrf_header(csrf), as: :json
    end
    assert_response :created

    visit = response.parsed_body["saunaVisit"]
    assert visit.present?
    assert visit["id"].present?
    assert_equal valid_attributes[:name], visit["name"]
    assert_equal valid_attributes[:lat], visit["lat"]
    assert_equal valid_attributes[:lng], visit["lng"]
    assert_equal valid_attributes[:area], visit["area"]
    assert_equal valid_attributes[:status], visit["status"]
    assert_equal valid_attributes[:tags], visit["tags"]
    assert_equal 1, visit["history"].size
    assert_equal valid_attributes[:date], visit["history"].first["date"]
    assert_equal valid_attributes[:comment], visit["history"].first["comment"]
    assert_equal valid_attributes[:rating], visit["history"].first["rating"]
  end

  test "既存のサウナ訪問記録を正しく更新できる" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    visit = response.parsed_body.fetch("saunaVisit")

    patch "/api/v1/sauna_visits/#{visit['id']}", params: {
      saunaVisit: valid_attributes.merge(
        name: "北欧（更新）",
        status: "wishlist",
        rating: 4,
        comment: "更新コメント",
        lockVersion: visit["lockVersion"]
      )
    }, headers: csrf_header(csrf), as: :json
    assert_response :success

    updated = response.parsed_body["saunaVisit"]
    assert_equal "北欧（更新）", updated["name"]
    assert_equal "wishlist", updated["status"]
    assert_equal "更新コメント", updated["history"].first["comment"]
    assert_equal 4, updated["history"].first["rating"]
  end

  test "一覧(index)は更新日時順で取得でき、正しくシリアライズされる" do
    csrf = sign_in

    # 1件目作成
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(name: "サウナA") },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    visit_a = response.parsed_body.fetch("saunaVisit")

    # 2件目作成 (画像あり)
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(name: "サウナB", image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    visit_b = response.parsed_body.fetch("saunaVisit")

    # 1件目を更新して updated_at を最新にする
    patch "/api/v1/sauna_visits/#{visit_a['id']}", params: {
      saunaVisit: valid_attributes.merge(name: "サウナA(更新)", lockVersion: visit_a["lockVersion"])
    }, headers: csrf_header(csrf), as: :json
    assert_response :success

    # 3件目作成 (画像と複数の履歴を持たせる)
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(name: "サウナC") },
      headers: csrf_header(csrf), as: :json
    visit_c = response.parsed_body.fetch("saunaVisit")

    patch "/api/v1/sauna_visits/#{visit_c['id']}", params: {
      saunaVisit: valid_attributes.merge(appendHistory: true, image: png_data_url)
    }, headers: csrf_header(csrf), as: :json
    assert_response :success

    # N+1チェックのためクエリ数をカウント
    queries = 0
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
      queries += 1 if payload[:sql].match?(/SELECT /i)
    end

    get "/api/v1/sauna_visits"
    assert_response :success

    ActiveSupport::Notifications.unsubscribe(subscriber)

    # 発行されるSELECTクエリは User, SaunaVisit, VisitHistoryEntry, ActiveStorage::Attachment, ActiveStorage::Blob の5回程度に収まるはず
    assert_operator queries, :<=, 6, "N+1クエリが発生している可能性があります"

    visits = response.parsed_body["saunaVisits"]
    assert_equal 3, visits.size

    # 更新日時(updated_at)の降順になっているか確認: 最後に更新されたC, 次にA(更新), 最後にB
    assert_equal visit_c["id"], visits[0]["id"]
    assert_equal visit_a["id"], visits[1]["id"]
    assert_equal visit_b["id"], visits[2]["id"]

    assert_equal "サウナA(更新)", visits[1]["name"]

    # シリアライズの検証
    assert_includes visits[0], "id"
    assert_includes visits[0], "name"
    assert_includes visits[0], "lat"
    assert_includes visits[0], "lng"
    assert_includes visits[0], "status"
    assert_includes visits[0], "tags"
    assert_includes visits[0], "history"

    # サウナCの履歴は2件あるはず
    assert_equal 2, visits[0]["history"].size
  end

  test "作成・一覧・更新をログインユーザーへ限定する" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    external_id = response.parsed_body.dig("saunaVisit", "id")

    other = User.create!(google_subject: "other", email: "other@example.com")
    other.sauna_visits.create!(name: "他人", latitude: 35, longitude: 139, status: "visited")

    get "/api/v1/sauna_visits"
    assert_equal [ external_id ], response.parsed_body["saunaVisits"].pluck("id")

    patch "/api/v1/sauna_visits/#{other.sauna_visits.first.external_id}",
      params: { saunaVisit: valid_attributes }, headers: csrf_header(csrf), as: :json
    assert_response :not_found
  end

  test "自身のサウナ記録を削除できる" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    external_id = response.parsed_body.dig("saunaVisit", "id")

    delete "/api/v1/sauna_visits/#{external_id}", headers: csrf_header(csrf)
    assert_response :no_content

    get "/api/v1/sauna_visits"
    assert_empty response.parsed_body["saunaVisits"]
  end

  test "写真付きサウナ記録を削除すると紐づく写真blobも破棄される" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: {
      saunaVisit: valid_attributes.merge(image: png_data_url)
    }, headers: csrf_header(csrf), as: :json
    assert_response :created
    visit = response.parsed_body.fetch("saunaVisit")
    image_path = visit.fetch("image")
    blob = ActiveStorage::Blob.find_signed!(image_path.split("/").last)

    perform_enqueued_jobs do
      delete "/api/v1/sauna_visits/#{visit.fetch('id')}", headers: csrf_header(csrf)
      assert_response :no_content
    end
    assert_not ActiveStorage::Blob.exists?(blob.id), "削除したサウナ記録の写真blobが残っています"
  end

  test "他人のサウナ記録は削除できない" do
    csrf = sign_in
    other = User.create!(google_subject: "other", email: "other@example.com")
    visit = other.sauna_visits.create!(name: "他人", latitude: 35, longitude: 139, status: "visited")

    delete "/api/v1/sauna_visits/#{visit.external_id}", headers: csrf_header(csrf)
    assert_response :not_found
  end

  test "存在しないサウナ記録の削除は404を返す" do
    csrf = sign_in

    delete "/api/v1/sauna_visits/missing-id", headers: csrf_header(csrf)
    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "validation errorと楽観ロック競合を共通形式で返す" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(lat: 100) },
      headers: csrf_header(csrf), as: :json
    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")

    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    visit = response.parsed_body.fetch("saunaVisit")
    id = visit.fetch("id")
    original_lock = visit.fetch("lockVersion")

    patch "/api/v1/sauna_visits/#{id}",
      params: { saunaVisit: valid_attributes.merge(name: "先の更新", lockVersion: original_lock) },
      headers: csrf_header(csrf), as: :json
    assert_response :success

    patch "/api/v1/sauna_visits/#{id}",
      params: { saunaVisit: valid_attributes.merge(name: "古い更新", lockVersion: original_lock) },
      headers: csrf_header(csrf), as: :json
    assert_response :conflict
    assert_equal "conflict", response.parsed_body.dig("error", "code")
  end

  test "SVGを拒否し写真を所有者だけへ配信する" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: {
      saunaVisit: valid_attributes.merge(image: "data:image/svg+xml;base64,PHN2Zz4=")
    }, headers: csrf_header(csrf), as: :json
    assert_response :unprocessable_content
    assert_equal "invalid_image", response.parsed_body.dig("error", "code")

    post "/api/v1/sauna_visits", params: {
      saunaVisit: valid_attributes.merge(image: png_data_url)
    }, headers: csrf_header(csrf), as: :json
    assert_response :created
    image_path = response.parsed_body.dig("saunaVisit", "image")

    get image_path
    assert_response :success
    assert_equal "image/png", response.media_type

    delete "/api/v1/session", headers: csrf_header(csrf)
    assert_response :no_content
    get image_path
    assert_response :unauthorized
  end

  test "写真削除を含む更新が失敗しても既存写真を保持する" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: {
      saunaVisit: valid_attributes.merge(image: png_data_url)
    }, headers: csrf_header(csrf), as: :json
    assert_response :created
    visit = response.parsed_body.fetch("saunaVisit")
    image_path = visit.fetch("image")
    blob = ActiveStorage::Blob.find_signed!(image_path.split("/").last)

    patch "/api/v1/sauna_visits/#{visit.fetch('id')}", params: {
      saunaVisit: valid_attributes.merge(lat: 100, image: nil, lockVersion: visit.fetch("lockVersion"))
    }, headers: csrf_header(csrf), as: :json
    assert_response :unprocessable_content

    get image_path
    assert_response :success
    assert_equal "image/png", response.media_type

    perform_enqueued_jobs do
      patch "/api/v1/sauna_visits/#{visit.fetch('id')}", params: {
        saunaVisit: valid_attributes.merge(image: nil, lockVersion: visit.fetch("lockVersion"))
      }, headers: csrf_header(csrf), as: :json
      assert_response :success
    end
    assert_not ActiveStorage::Blob.exists?(blob.id)
  end

  test "更新レスポンスは履歴件数に比例して写真クエリを増やさない" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    id = response.parsed_body.dig("saunaVisit", "id")

    # 履歴を積み増して、件数が変わってもクエリ数が変わらないことを比較できるようにする
    single_history_queries = count_attachment_queries do
      patch "/api/v1/sauna_visits/#{id}",
        params: { saunaVisit: valid_attributes.merge(appendHistory: true, image: png_data_url) },
        headers: csrf_header(csrf), as: :json
      assert_response :success
    end

    2.times do
      patch "/api/v1/sauna_visits/#{id}",
        params: { saunaVisit: valid_attributes.merge(appendHistory: true, image: png_data_url) },
        headers: csrf_header(csrf), as: :json
      assert_response :success
    end

    many_history_queries = count_attachment_queries do
      patch "/api/v1/sauna_visits/#{id}",
        params: { saunaVisit: valid_attributes.merge(appendHistory: true, image: png_data_url) },
        headers: csrf_header(csrf), as: :json
      assert_response :success
    end

    assert_equal 5, response.parsed_body.dig("saunaVisit", "history").size
    assert_equal single_history_queries, many_history_queries,
      "履歴ごとに添付を引いています（serialized の先読みが外れていないか確認してください）"
  end

  private

  def count_attachment_queries(&block)
    count = 0
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
      count += 1 if payload[:sql].include?("active_storage_attachments")
    end
    block.call
    count
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber)
  end
end
