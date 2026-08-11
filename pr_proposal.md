## 🎯 What

The `StaticController` in the Rails backend had a testing gap where the `index` and `stats` actions were completely untested. These actions are responsible for serving `index.html` and `stats.html` from the `public` directory respectively, falling back to a `404 Not Found` response if the files are absent. This PR introduces a dedicated integration test suite `StaticControllerTest` to cover these critical endpoints.

## 📊 Coverage

The following scenarios are now fully tested in `backend/test/controllers/static_controller_test.rb`:

1.  **`index` Action (Happy Path):** Simulates the presence of `public/index.html` and verifies that the controller responds with a `200 OK` status and the `text/html` media type.
2.  **`index` Action (Error Path):** Simulates the absence of `public/index.html` and verifies that the controller responds with a `404 Not Found` status.
3.  **`stats` Action (Happy Path):** Simulates the presence of `public/stats.html` and verifies that the controller responds with a `200 OK` status and the `text/html` media type.
4.  **`stats` Action (Error Path):** Simulates the absence of `public/stats.html` and verifies that the controller responds with a `404 Not Found` status.

*Implementation Note:* To cleanly and safely isolate the file system interactions without external mocking libraries (like Mocha) or side effects on the actual repository, a custom test helper block (`with_temp_root`) was authored. This helper dynamically overrides the `Rails.root` directory method for the duration of the test, pointing it to an ephemeral directory created via `Dir.mktmpdir`, and restores it in an `ensure` block.

## ✨ Result

The `StaticController` is now backed by deterministic tests that catch missing files and incorrect response codes. This prevents regressions in static file serving and increases overall test suite reliability, allowing confident refactoring moving forward.
