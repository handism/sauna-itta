require "test_helper"

class ApiV1ImagesTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "他ユーザーの写真は署名IDを知っていても404にする" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    image_path = response.parsed_body.dig("saunaVisit", "image")

    delete "/api/v1/session", headers: csrf_header(csrf)
    assert_response :no_content

    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(uid: "intruder", email: "intruder@example.com")
    ENV["ALLOWED_GOOGLE_EMAIL"] = "intruder@example.com"
    sign_in

    get image_path
    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "未認証では写真を配信しない" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    image_path = response.parsed_body.dig("saunaVisit", "image")

    delete "/api/v1/session", headers: csrf_header(csrf)
    get image_path

    assert_response :unauthorized
    assert_equal "unauthenticated", response.parsed_body.dig("error", "code")
  end

  test "所有者にはキャッシュを共有しない形で配信する" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created

    get response.parsed_body.dig("saunaVisit", "image")

    assert_response :success
    assert_equal "image/png", response.media_type
    assert_includes response.headers["Cache-Control"], "private"
    assert_includes response.headers["Content-Disposition"], "inline"
    assert response.headers["ETag"].present?
  end

  test "ETagが一致する再取得は304を返し本文を送らない" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    image_path = response.parsed_body.dig("saunaVisit", "image")

    get image_path
    assert_response :success
    etag = response.headers["ETag"]

    get image_path, headers: { "If-None-Match" => etag }

    assert_response :not_modified
    assert_predicate response.body, :empty?
  end

  test "不正な署名IDは404を返す" do
    sign_in

    get "/api/v1/images/invalid-signed-id"

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "対応するAttachmentがない場合は404を返す" do
    csrf = sign_in
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(image: png_data_url) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    image_path = response.parsed_body.dig("saunaVisit", "image")

    # DBからAttachmentを削除してRecordNotFoundを誘発
    ActiveStorage::Attachment.destroy_all

    get image_path
    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
    assert_equal "対象の記録が見つかりません。", response.parsed_body.dig("error", "message")
  end

  test "署名の有効期限切れや改ざんによるInvalidSignatureを処理できる" do
    sign_in

    begin
      original_method = ActiveStorage::Blob.method(:find_signed!)
      ActiveStorage::Blob.define_singleton_method(:find_signed!) do |*args|
        raise ActiveSupport::MessageVerifier::InvalidSignature
      end

      get "/api/v1/images/invalid-or-tampered-signed-id"
    ensure
      ActiveStorage::Blob.define_singleton_method(:find_signed!, &original_method)
    end

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
    assert_equal "対象の記録が見つかりません。", response.parsed_body.dig("error", "message")
  end
end
