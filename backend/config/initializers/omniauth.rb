Rails.application.config.middleware.use OmniAuth::Builder do
  client_id = Rails.env.production? ? ENV.fetch("GOOGLE_CLIENT_ID", "") : ENV.fetch("GOOGLE_CLIENT_ID", "development-client-id")
  client_secret = Rails.env.production? ? ENV.fetch("GOOGLE_CLIENT_SECRET", "") : ENV.fetch("GOOGLE_CLIENT_SECRET", "development-client-secret")

  provider :google_oauth2,
    client_id,
    client_secret,
    scope: "email profile",
    prompt: "select_account"
end

# 本番で未設定でも起動は止めない。マイグレーション用のCloud Run Job（infra/main.tf）と
# CIのスモークテストはOAuthの値を渡さずに同じイメージを起動するため、ここで例外にすると
# それらまで失敗する。代わりに、ログインを試すまで気付けない設定漏れを起動時のログに残す。
if Rails.env.production?
  missing = %w[GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET].select { |name| ENV[name].blank? }
  Rails.logger.error("Googleログインの設定がありません: #{missing.join(', ')}") if missing.any?
end

# OmniAuth 2の既定どおり、OAuthのrequest phaseはPOSTだけを許可する。
# omniauth-rails_csrf_protection がRailsのauthenticity_tokenを検証する。
OmniAuth.config.allowed_request_methods = [ :post ]
