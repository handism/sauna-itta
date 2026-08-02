# 🧪 [Testing] Add error path test for initial load in useSaunaVisits hook

## 🎯 **What**
This PR addresses a missing test case in `useSaunaVisits.test.ts` where the initial data load in the `useEffect` hook throws an error. Previously, there was no test confirming that `loadError` state gets correctly set when `repository.list()` fails during the mount phase.

## 📊 **Coverage**
- Added a specific test case that mocks `repository.list()` to reject with an error (e.g. "ネットワークエラー").
- Verified that the `catch` block correctly transitions `loadError` from `null` to the expected error message.
- Tested that the component safely resolves its `loading` state to `false` even if an error is thrown.

## ✨ **Result**
- Test coverage for the `useSaunaVisits` hook is improved, effectively ensuring that the `loadError` logic for the critical initial loading path functions correctly and does not break during future refactoring.
- The hook is now robustly tested against network or parsing failures during initial hydration.
