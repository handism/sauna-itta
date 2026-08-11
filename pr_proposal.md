## 🎯 What

This PR addresses a GitHub Actions CI build failure (`Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`) occurring in the Next.js frontend, as well as fixing a missing test coverage issue for the `StaticController` in the Rails backend.

1.  **Frontend Build Fix:** The Turbopack build was failing because the explicit font weight requests (`300`, `400`, `600`) for the Google Font 'Outfit' were resulting in 404 responses from `fonts.gstatic.com`. I removed the strict `weight` constraints in `layout.tsx` so that Next.js falls back to downloading the variable version of the font, which successfully resolves the 404 issue.
2.  **Backend Test Coverage:** The `StaticController` lacked tests for its `index` and `stats` actions. These actions are responsible for serving `index.html` and `stats.html` from the `public` directory respectively, falling back to a `404 Not Found` response if the files are absent. This PR introduces a dedicated integration test suite `StaticControllerTest` to cover these critical endpoints.

## 📊 Coverage

### Backend
The following scenarios are now fully tested in `backend/test/controllers/static_controller_test.rb`:
1.  **`index` Action (Happy Path):** Simulates the presence of `public/index.html` and verifies that the controller responds with a `200 OK` status and the `text/html` media type.
2.  **`index` Action (Error Path):** Simulates the absence of `public/index.html` and verifies that the controller responds with a `404 Not Found` status.
3.  **`stats` Action (Happy Path):** Simulates the presence of `public/stats.html` and verifies that the controller responds with a `200 OK` status and the `text/html` media type.
4.  **`stats` Action (Error Path):** Simulates the absence of `public/stats.html` and verifies that the controller responds with a `404 Not Found` status.

*Implementation Note:* To cleanly and safely isolate the file system interactions without external mocking libraries (like Mocha) or side effects on the actual repository, a custom test helper block (`with_temp_root`) was authored. This helper dynamically overrides the `Rails.root` directory method for the duration of the test, pointing it to an ephemeral directory created via `Dir.mktmpdir`, and restores it in an `ensure` block.

## ✨ Result

The frontend build now successfully compiles in CI by properly fetching the variable font version of Outfit.
The `StaticController` is now backed by deterministic tests that catch missing files and incorrect response codes. This prevents regressions in static file serving and increases overall test suite reliability, allowing confident refactoring moving forward.
