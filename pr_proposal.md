# 🧪 Add Error Path Tests for useSaunaVisits Hook

## 🎯 What
This PR addresses a missing testing gap in the `useSaunaVisits` hook by adding error path tests. Specifically, the test file lacked coverage for handling network/repository errors when fetching the initial visit list or when explicitly calling `reload()`.

## 📊 Coverage
The following new scenarios are now tested:
- `loadError` is correctly set and `loading` is toggled off when `reload()` fails (e.g., due to a network error).
- `loadError` is correctly set and `visits` safely defaults to an empty array when the initial component mount load fails.

## ✨ Result
Test coverage for `useSaunaVisits.ts` has improved, with robust guarantees that asynchronous state (`loading`, `loadError`) responds appropriately when the API repository throws errors. All tests pass successfully and no regressions were introduced.
