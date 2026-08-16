require "test_helper"

class AuthCallbacksTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "許可メールのコールバックはユーザーを作りセッションを開始する" do
    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    assert User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    get "/api/v1/session"
    assert response.parsed_body["authenticated"]
  end

  test "Google OAuthの開始はCSRFトークン付きPOSTだけを許可する" do
    get "/api/v1/session"
    csrf_token = response.parsed_body.fetch("csrfToken")

    get "/auth/google_oauth2"
    assert_response :not_found

    post "/auth/google_oauth2"
    assert_redirected_to "/auth/failure?message=ActionController%3A%3AInvalidAuthenticityToken&strategy=google_oauth2"

    post "/auth/google_oauth2", params: { authenticity_token: csrf_token }
    assert_redirected_to "/auth/google_oauth2/callback"
  end

  # 許可メール以外でセッションが作られないことは api_v1_sauna_visits_test.rb 側でも押さえている。
  # ここではリダイレクト先の理由コードと、ユーザーレコードを作らないことまで確認する。

  test "許可メール以外は理由つきで戻しユーザーも作らない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email: "denied@example.com")

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_equal "このアカウントは許可されていません。", flash[:alert]
    assert_not User.exists?(email: "denied@example.com")
    get "/api/v1/session"
    assert_not response.parsed_body["authenticated"]
  end

  test "メールが確認済みでないGoogleアカウントではセッションを作らない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: false)

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_equal "このアカウントは許可されていません。", flash[:alert]
    assert_not User.exists?(email: ApiAuthHelper::ALLOWED_EMAIL)
    get "/api/v1/session"
    assert_not response.parsed_body["authenticated"]
  end

  test "email_verifiedが欠けている応答も許可しない" do
    OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash(email_verified: nil)

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/?authError=forbidden"
    assert_equal "このアカウントは許可されていません。", flash[:alert]
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
    assert_equal "Googleログインに失敗しました。", flash[:alert]
  end

  test "ログインのたびにセッションIDを作り直す" do
    sign_in
    first_session_cookie = cookies[:_sauna_itta_session]

    get "/auth/google_oauth2/callback"

    assert_redirected_to "/"
    assert_not_equal first_session_cookie, cookies[:_sauna_itta_session]
  end
end
