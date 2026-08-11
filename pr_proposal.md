## 🎯 What
This PR adds explicit tests for `ApplicationController` in the Rails backend. Prior to this, critical application-wide logic, such as rescuing from `ActionController::InvalidAuthenticityToken` and the `render_error` helper, lacked direct test coverage.

## 📊 Coverage
The new `ApplicationControllerTest` uses an inline `DummyController` and dynamically drawn routes to isolate and test the base controller. It covers:
* The `current_user` method, verifying behavior for both unauthenticated (nil) and authenticated users.
* The `rescue_from ActionController::InvalidAuthenticityToken` block, ensuring it returns the expected `invalid_csrf` error payload and `:unprocessable_content` status.
* The `render_error` helper method, ensuring the JSON response is structured correctly both with and without the optional `details` parameter.

## ✨ Result
The application's core error handling and authentication helpers are now explicitly tested, preventing regressions when modifying globally shared logic. The backend test suite continues to pass with no failures.
