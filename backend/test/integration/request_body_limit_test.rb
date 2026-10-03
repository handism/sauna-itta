require "test_helper"

class RequestBodyLimitTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "上限を超えるボディのAPIリクエストは解析せずに413で返す" do
    csrf = sign_in

    post "/api/v1/sauna_visits/imports", params: "{}", headers: csrf_header(csrf).merge(
      "CONTENT_TYPE" => "application/json",
      "CONTENT_LENGTH" => (RequestBodyLimit::MAX_BYTES + 1).to_s
    )

    assert_response :content_too_large
    assert_equal "payload_too_large", response.parsed_body.dig("error", "code")
  end

  test "上限以内のボディはそのまま通す" do
    csrf = sign_in

    post "/api/v1/sauna_visits/imports", params: { saunaVisits: [ valid_attributes.merge(id: "within-limit") ] }, headers: csrf_header(csrf), as: :json

    assert_response :success
  end
end
