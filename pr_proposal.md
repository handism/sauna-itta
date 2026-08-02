# 🔒 Security Vulnerability Fix: Insecure OmniAuth GET Method Allowed

## 🎯 What
The OmniAuth configuration was explicitly allowing `:get` methods for the authentication request phase (`OmniAuth.config.allowed_request_methods = [ :get ]`), and suppressing warnings for this practice (`OmniAuth.config.silence_get_warning = true`). This PR enforces secure default behavior by ensuring only POST requests are permitted for authentication initialization, and by leaving the warning mechanism intact. The configuration file `backend/config/initializers/omniauth.rb` has been verified to explicitly specify `[ :post ]`.

## ⚠️ Risk
Allowing GET requests for OAuth initiation exposes the application to Cross-Site Request Forgery (CSRF) attacks. An attacker could potentially embed an image or a link in a malicious site pointing to the login endpoint, forcing a victim's browser to initiate an OAuth flow without their consent. This could lead to a scenario where an attacker might inject their own credentials or hijack an authentication session, compromising user account integrity.

## 🛡️ Solution
The `OmniAuth.config.allowed_request_methods` configuration has been restricted to `[ :post ]`. This requires the authentication request phase to be initiated via a POST request, which integrates with Rails' built-in CSRF protection (`authenticity_token`). The `omniauth-rails_csrf_protection` gem validates these tokens, successfully mitigating the CSRF vulnerability. The `silence_get_warning` configuration was also removed.
