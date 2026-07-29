Title: "🧹 Remove leftover console.debug in ServiceWorkerRegister"

Description:
* 🎯 **What:** Removed the leftover `console.debug` and its containing `.then(...)` block in `ServiceWorkerRegister.tsx`.
* 💡 **Why:** `console.debug` statements intended for debugging during development can clutter logs and reduce code cleanliness. Removing it improves readability and maintainability.
* ✅ **Verification:** Re-ran `npm run lint` and `npx vitest run` to confirm that the existing test suite continues to pass without errors.
* ✨ **Result:** The service worker registration maintains correct error handling and is more concise.
