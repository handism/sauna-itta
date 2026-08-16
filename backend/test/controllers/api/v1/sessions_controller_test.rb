require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "show returns unauthenticated state when not logged in" do
    get api_v1_session_url
    assert_response :success
    json = response.parsed_body

    assert_equal false, json["authenticated"]
    assert_nil json["user"]
    assert_not_nil json["csrfToken"]
  end

  test "show returns authenticated state and user info when logged in" do
    sign_in

    get api_v1_session_url
    assert_response :success
    json = response.parsed_body

    assert_equal true, json["authenticated"]
    assert_equal ALLOWED_EMAIL, json.dig("user", "email")
    assert_not_nil json["csrfToken"]
  end

  test "destroy resets session and returns no_content" do
    token = sign_in

    delete api_v1_session_url, headers: csrf_header(token)
    assert_response :no_content

    get api_v1_session_url
    assert_response :success
    json = response.parsed_body

    assert_equal false, json["authenticated"]
    assert_nil json["user"]
  end
end
