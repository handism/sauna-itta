Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV.fetch("GOOGLE_CLIENT_ID", "development-client-id"),
    ENV.fetch("GOOGLE_CLIENT_SECRET", "development-client-secret"),
    scope: "email profile",
    prompt: "select_account"
end

OmniAuth.config.allowed_request_methods = [ :get ]
OmniAuth.config.silence_get_warning = true
