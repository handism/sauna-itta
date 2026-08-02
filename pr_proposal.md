# 🧪 [testing improvement] Add missing error path test in useVisitImportExport

## 🎯 **What**
This PR addresses a testing gap in `useVisitImportExport.ts` by adding a test case to cover the scenario where both the data import batch process and the subsequent reload mechanism fail. Previously, the error logging behavior ("インポート失敗後の再読み込みにも失敗しました。") and error object thrown were not tested.

## 📊 **Coverage**
The new test case verifies:
- `importBatch` throwing an error simulates an API import failure.
- A subsequent failure in `reload` correctly triggers the nested `catch` block.
- `console.error` is called with the exact message "インポート失敗後の再読み込みにも失敗しました。" along with the mocked error.
- A failure toast is displayed correctly informing the user about the connection error.
- Ensures robust testing by safely spying on `console.error` and restoring it after execution.

## ✨ **Result**
Increased the test coverage in `useVisitImportExport.ts` and enhanced the overall reliability of the codebase by verifying that unexpected catastrophic failures during data imports are logged and handled as expected. The test suite is now stronger in catching potential regressions.
