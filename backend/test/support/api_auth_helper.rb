module ApiAuthHelper
  ALLOWED_EMAIL = "owner@example.com".freeze
  # 1x1のPNG（Marcelのマジックバイト判定を通す最小データ）
  PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=".freeze

  def self.included(base)
    base.setup do
      @original_allowed_email = ENV["ALLOWED_GOOGLE_EMAIL"]
      ENV["ALLOWED_GOOGLE_EMAIL"] = ALLOWED_EMAIL
      OmniAuth.config.test_mode = true
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth_hash
    end

    base.teardown do
      ENV["ALLOWED_GOOGLE_EMAIL"] = @original_allowed_email
      OmniAuth.config.mock_auth[:google_oauth2] = nil
      OmniAuth.config.test_mode = false
    end
  end

  def google_auth_hash(uid: "owner-subject", email: ALLOWED_EMAIL)
    OmniAuth::AuthHash.new(provider: "google_oauth2", uid: uid, info: { email: email })
  end

  # ログインしてCSRFトークンを返す
  def sign_in
    get "/auth/google_oauth2/callback"
    assert_response :redirect
    get "/api/v1/session"
    response.parsed_body.fetch("csrfToken")
  end

  def csrf_header(token)
    { "X-CSRF-Token" => token }
  end

  def png_data_url
    "data:image/png;base64,#{PNG_BASE64}"
  end

  def valid_attributes
    {
      name: "北欧",
      lat: 35.71,
      lng: 139.77,
      area: "東京都",
      status: "visited",
      tags: [ "外気浴" ],
      date: "2026-08-02",
      comment: "最高",
      rating: 5,
      image: nil,
      appendHistory: false
    }
  end
end
