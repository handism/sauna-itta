require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  setup do
    User.create!(google_subject: "owner-subject", email: ApiAuthHelper::ALLOWED_EMAIL)
  end

  test "show returns authenticated status and user details when logged in" do
    token = sign_in

    get "/api/v1/session"
    assert_response :success

    json = response.parsed_body
    assert_equal true, json["authenticated"]
    assert_equal ApiAuthHelper::ALLOWED_EMAIL, json.dig("user", "email")
    assert_not_nil json["csrfToken"]
  end

  test "show returns unauthenticated status when logged out" do
    get "/api/v1/session"
    assert_response :success

    json = response.parsed_body
    assert_equal false, json["authenticated"]
    assert_nil json["user"]
    assert_not_nil json["csrfToken"]
  end

  test "destroy resets the session and returns no_content" do
    token = sign_in

    # Verify we are logged in
    get "/api/v1/session"
    assert_equal true, response.parsed_body["authenticated"]

    # Call destroy
    delete "/api/v1/session", headers: csrf_header(token)
    assert_response :no_content

    # Verify we are logged out
    get "/api/v1/session"
    assert_equal false, response.parsed_body["authenticated"]
  end
end
