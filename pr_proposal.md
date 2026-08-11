## Title: 🔒 Fix hardcoded default Google Client Secret vulnerability

## Description:

### 🎯 What:
Removed the hardcoded default fallback values (`"development-client-id"`, `"development-client-secret"`) for the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables in the production environment.

### ⚠️ Risk:
Previously, if a production environment failed to set the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables, the application would silently fall back to using development secrets. This could put the application at risk if those default fallback values were known to an attacker, potentially allowing them to compromise the authentication mechanism or exploit an improperly configured production setup. It violates security best practices by allowing production to boot with unsafe default credentials instead of failing securely.

### 🛡️ Solution:
Updated `config/initializers/omniauth.rb` to conditionally apply the fallback values based on the environment. If `Rails.env.production?` is true, the initializer uses `ENV.fetch(key, "")` to fall back to an empty string. This securely prevents the use of known credentials and allows the OAuth flow to fail safely if the variables are missing, while also preventing the application from crashing via `KeyError` during CI/CD or build tasks (like `db:prepare`) that run in the production environment but do not supply these runtime secrets. In non-production environments (like development and test), the fallback values are retained to ensure local development workflows remain unbroken out-of-the-box.

