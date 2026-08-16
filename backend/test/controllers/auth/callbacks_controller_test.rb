require "test_helper"

class Auth::CallbacksControllerTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "should create session and redirect to root when auth is valid" do
    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    assert User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    assert_equal User.find_by(email: ApiAuthHelper::ALLOWED_EMAIL).id, session[:user_id]
  end

  test "should not create session and redirect to error when email is unallowed" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email: "denied@example.com")

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_not User.exists?(email: "denied@example.com")
    assert_nil session[:user_id]
  end

  test "should not create session when email is not verified" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: false)

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_not User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    assert_nil session[:user_id]
  end

  test "should handle string true email_verified" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: "true")

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    assert User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    assert_equal User.find_by(email: ApiAuthHelper::ALLOWED_EMAIL).id, session[:user_id]
  end

  test "should handle failure callback" do
    get "/auth/failure"

    assert_redirected_to "/?authError=failed"
  end
end
