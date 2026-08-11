Rails.application.config.middleware.use OmniAuth::Builder do
  client_id = Rails.env.production? ? ENV.fetch("GOOGLE_CLIENT_ID") : ENV.fetch("GOOGLE_CLIENT_ID", "development-client-id")
  client_secret = Rails.env.production? ? ENV.fetch("GOOGLE_CLIENT_SECRET") : ENV.fetch("GOOGLE_CLIENT_SECRET", "development-client-secret")

  provider :google_oauth2,
    client_id,
    client_secret,
    scope: "email profile",
    prompt: "select_account"
end

# OmniAuth 2の既定どおり、OAuthのrequest phaseはPOSTだけを許可する。
# omniauth-rails_csrf_protection がRailsのauthenticity_tokenを検証する。
OmniAuth.config.allowed_request_methods = [ :post ]
