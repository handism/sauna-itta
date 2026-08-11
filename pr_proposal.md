## 🧪 Add tests for HealthController

### 🎯 What
This PR addresses the testing gap in `backend/app/controllers/health_controller.rb`. The controller logic is simple but critical, and it lacked tests.

### 📊 Coverage
Added integration tests to cover:
1. **Happy path:** Verifies that a successful request to `/up` returns a 200 OK status code and "ok" body.
2. **Error condition:** Verifies the behavior when the database is unavailable. It safely mocks `ActiveRecord::Base.connection.select_value` to raise an `ActiveRecord::ActiveRecordError` and checks that a 503 Service Unavailable status code and "database unavailable" body are returned.

### ✨ Result
Improved test coverage for the health check endpoint, ensuring that both success and failure cases are actively tested and validated in the test suite.
