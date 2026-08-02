Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV.fetch("GOOGLE_CLIENT_ID", "development-client-id"),
    ENV.fetch("GOOGLE_CLIENT_SECRET", "development-client-secret"),
    scope: "email profile",
    prompt: "select_account"
end

# OmniAuth 2の既定どおり、OAuthのrequest phaseはPOSTだけを許可する。
# omniauth-rails_csrf_protection がRailsのauthenticity_tokenを検証する。
OmniAuth.config.allowed_request_methods = [ :post ]
