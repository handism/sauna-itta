require "test_helper"

class ApiV1ImportsTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "未ログイン時は401を返す" do
    # GET してCSRFトークンを取得（未ログイン状態）
    get "/api/v1/session"
    csrf = response.parsed_body.fetch("csrfToken")

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [] }, headers: csrf_header(csrf), as: :json
    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")
  end

  test "インポートはIDを保持して重複をスキップする" do
    csrf = sign_in
    imported = valid_attributes.merge(id: "legacy-id", visitCount: 4)

    2.times do
      post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
        headers: csrf_header(csrf), as: :json
      assert_response :success
    end

    assert_equal 1, owner.sauna_visits.where(external_id: "legacy-id").count
    assert_equal 0, response.parsed_body["added"]
    assert_equal 1, response.parsed_body["skipped"]
  end

  test "同じチャンク内でIDが重複する記録は1件だけ取り込む" do
    csrf = sign_in
    payload = [
      valid_attributes.merge(id: "legacy-dup-id", name: "1件目"),
      valid_attributes.merge(id: "legacy-dup-id", name: "2件目")
    ]

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :success
    assert_equal 1, response.parsed_body["added"]
    assert_equal 1, response.parsed_body["skipped"]
    assert_equal "1件目", owner.sauna_visits.sole.name
  end

  test "11件以上はbatch_too_largeで拒否する" do
    csrf = sign_in
    payload = Array.new(11) { |index| valid_attributes.merge(id: "legacy-#{index}") }

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "batch_too_large", response.parsed_body.dig("error", "code")
    assert_equal 0, owner.sauna_visits.count
  end

  test "配列以外のsaunaVisitsは500にせず422で返す" do
    csrf = sign_in

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: "不正なデータ" },
      headers: csrf_header(csrf), as: :json
    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ "不正な要素" ] },
      headers: csrf_header(csrf), as: :json
    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
  end

  test "配列の中にハッシュではない不正な要素が含まれる場合は422で返す" do
    csrf = sign_in
    payload = [ valid_attributes.merge(id: "legacy-ok"), "不正な要素" ]

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_equal "取り込むデータは記録の配列で指定してください。", response.parsed_body.dig("error", "message")
    assert_equal 0, owner.sauna_visits.count
  end

  test "saunaVisitsが無い場合も共通のエラー形式で返す" do
    csrf = sign_in

    post "/api/v1/sauna_visits/imports", params: {}, headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_includes response.parsed_body.dig("error", "message"), "saunaVisits"
  end

  test "IDが無い記録を含むチャンクは1件も取り込まない" do
    csrf = sign_in
    payload = [ valid_attributes.merge(id: "legacy-ok"), valid_attributes ]

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_equal "IDがない記録は取り込めません。", response.parsed_body.dig("error", "message")
    assert_equal 0, owner.sauna_visits.count
  end

  test "バリデーションに失敗する記録を含むチャンクはロールバックする" do
    csrf = sign_in
    payload = [
      valid_attributes.merge(id: "legacy-ok"),
      valid_attributes.merge(id: "legacy-ng", name: "")
    ]

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_equal 0, owner.sauna_visits.count
  end

  test "不正な画像を含むチャンクはロールバックしinvalid_imageを返す" do
    csrf = sign_in
    payload = [
      valid_attributes.merge(id: "legacy-ok"),
      valid_attributes.merge(id: "legacy-ng", image: "data:image/svg+xml;base64,PHN2Zz4=")
    ]

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: payload },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "invalid_image", response.parsed_body.dig("error", "code")
    assert_equal 0, owner.sauna_visits.count
  end

  test "履歴つきの記録は履歴IDと訪問回数を保持する" do
    csrf = sign_in
    imported = valid_attributes.merge(
      id: "legacy-history",
      visitCount: 5,
      history: [
        { id: "history-1", date: "2026-07-01", comment: "1回目", rating: 4 },
        { id: "history-2", date: "2026-08-01", comment: "2回目", rating: 5 }
      ]
    )

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
      headers: csrf_header(csrf), as: :json
    assert_response :success
    assert_equal 1, response.parsed_body["added"]

    get "/api/v1/sauna_visits"
    visit = response.parsed_body["saunaVisits"].sole
    assert_equal %w[history-1 history-2], visit["history"].pluck("id")
    assert_equal 5, visit["visitCount"]
  end

  test "他ユーザーと履歴IDが重複していても取り込める" do
    other = User.create!(google_subject: "other", email: "other@example.com")
    other_visit = other.sauna_visits.create!(name: "他人", latitude: 35, longitude: 139, status: "visited")
    other_visit.visit_history_entries.create!(public_id: "shared-history-id", visited_on: Date.new(2026, 7, 1))

    csrf = sign_in
    imported = valid_attributes.merge(
      id: "legacy-shared",
      history: [ { id: "shared-history-id", date: "2026-08-01", comment: "自分の記録" } ]
    )

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
      headers: csrf_header(csrf), as: :json

    assert_response :success
    assert_equal 1, response.parsed_body["added"]
    assert_equal "shared-history-id", owner.sauna_visits.sole.visit_history_entries.sole.public_id
  end

  test "同じ記録の中で履歴IDが重複する場合は取り込まない" do
    csrf = sign_in
    imported = valid_attributes.merge(
      id: "legacy-dup",
      history: [
        { id: "same-history-id", date: "2026-07-01" },
        { id: "same-history-id", date: "2026-08-01" }
      ]
    )

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
    assert_equal "validation_error", response.parsed_body.dig("error", "code")
    assert_equal 0, owner.sauna_visits.count
  end

  test "許可していない属性は取り込まない" do
    csrf = sign_in
    other = User.create!(google_subject: "other-subject", email: "other@example.com")
    # 未許可キーの扱いはテスト環境の設定に左右されるため、ここでは本番と同じ「黙って捨てる」で検証する
    original = ActionController::Parameters.action_on_unpermitted_parameters
    ActionController::Parameters.action_on_unpermitted_parameters = false

    imported = valid_attributes.merge(id: "legacy-mass-assign", user_id: other.id, created_at: "2000-01-01")

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
      headers: csrf_header(csrf), as: :json

    assert_response :success
    visit = owner.sauna_visits.sole
    assert_equal owner.id, visit.user_id
    assert_operator visit.created_at, :>, 1.day.ago
    assert_equal 0, other.sauna_visits.count
  ensure
    ActionController::Parameters.action_on_unpermitted_parameters = original
  end

  test "インポートにもCSRFトークンを要求する" do
    sign_in
    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ valid_attributes.merge(id: "x") ] }, as: :json

    assert_response :unprocessable_content
    assert_equal "invalid_csrf", response.parsed_body.dig("error", "code")
    assert_equal 0, owner.sauna_visits.count
  end

  test "画像保存中の予期せぬエラー発生時は画像をスキップして取り込みを完了する" do
    csrf = sign_in
    imported = valid_attributes.merge(id: "legacy-broken-storage", image: "data:image/png;base64,iVBORw0KGgo=")

    singleton = (class << DataUrlImage; self; end)
    original_method = DataUrlImage.method(:decode)
    singleton.define_method(:decode) { |_| raise ActiveStorage::Error, "ストレージ一時障害" }
    begin
      post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
        headers: csrf_header(csrf), as: :json
    ensure
      singleton.define_method(:decode, original_method)
    end

    assert_response :success
    assert_equal 1, response.parsed_body["added"]
    assert_equal 0, response.parsed_body["skipped"]
    visit = owner.sauna_visits.find_by!(external_id: "legacy-broken-storage")
    assert_equal "北欧", visit.name
    assert_not visit.visit_history_entries.first.image.attached?
  end

  test "画像保存中にStandardErrorが発生した場合は画像をスキップして取り込みを完了する" do
    csrf = sign_in
    imported = valid_attributes.merge(id: "legacy-broken-storage-standard-error", image: "data:image/png;base64,iVBORw0KGgo=")

    singleton = (class << DataUrlImage; self; end)
    original_method = DataUrlImage.method(:decode)
    singleton.define_method(:decode) { |_| raise StandardError, "不明なエラー" }
    begin
      post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ imported ] },
        headers: csrf_header(csrf), as: :json
    ensure
      singleton.define_method(:decode, original_method)
    end

    assert_response :success
    assert_equal 1, response.parsed_body["added"]
    assert_equal 0, response.parsed_body["skipped"]
    visit = owner.sauna_visits.find_by!(external_id: "legacy-broken-storage-standard-error")
    assert_equal "北欧", visit.name
    assert_not visit.visit_history_entries.first.image.attached?
  end

  private

  def owner
    User.find_by!(email: ApiAuthHelper::ALLOWED_EMAIL)
  end
end
