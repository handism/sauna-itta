require "test_helper"

class AuthCallbacksTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  # 許可メール以外を弾く経路は api_v1_sauna_visits_test.rb 側で押さえている。
  # ここでは「メールは一致するが確認済みでない」場合と失敗コールバックを検証する。

  test "メールが確認済みでないGoogleアカウントではセッションを作らない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: false)

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_not User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    get "/api/v1/session"
    assert_not response.parsed_body["authenticated"]
  end

  test "email_verifiedが欠けている応答も許可しない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: nil)

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    get "/api/v1/session"
    assert_not response.parsed_body["authenticated"]
  end

  test "文字列のemail_verifiedもtrueとして扱う" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: "true")

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    get "/api/v1/session"
    assert response.parsed_body["authenticated"]
  end

  test "ログイン失敗はトップへ理由つきで戻す" do
    get "/auth/failure"

    assert_redirected_to "/?authError=failed"
  end

  test "ログインのたびにセッションIDを作り直す" do
    sign_in
    first_session_cookie = cookies[:_sauna_itta_session]

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    assert_not_equal first_session_cookie, cookies[:_sauna_itta_session]
  end
end
