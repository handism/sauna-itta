require "test_helper"

class ApiV1SaunaVisitsTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "未認証では一覧を取得できない" do
    get "/api/v1/sauna_visits"
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

  test "作成・一覧・削除をログインユーザーへ限定する" do
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

    patch "/api/v1/sauna_visits/#{visit.fetch('id')}", params: {
      saunaVisit: valid_attributes.merge(image: nil, lockVersion: visit.fetch("lockVersion"))
    }, headers: csrf_header(csrf), as: :json
    assert_response :success
    assert_not ActiveStorage::Blob.exists?(blob.id)
  end
end
