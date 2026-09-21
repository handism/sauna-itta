Rails.application.config.middleware.use OmniAuth::Builder do
  client_id = ENV.fetch("GOOGLE_CLIENT_ID", "")
  client_secret = ENV.fetch("GOOGLE_CLIENT_SECRET", "")

  provider :google_oauth2,
    client_id,
    client_secret,
    scope: "email profile",
    prompt: "select_account"
end

# OmniAuth 2の既定どおり、OAuthのrequest phaseはPOSTだけを許可する。
# omniauth-rails_csrf_protection がRailsのauthenticity_tokenを検証する。
OmniAuth.config.allowed_request_methods = [ :post ]
