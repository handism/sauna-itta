## Title
🧪 Add error path tests for useVisitImportExport

## Description
🎯 **What:** This PR addresses the testing gap in `useVisitImportExport.ts` by adding missing tests for error paths during file import.
📊 **Coverage:** The new tests cover scenarios where `saveVisits` returns false (failed save) and when parsing the JSON fails, asserting the correct error messages are shown via toast.
✨ **Result:** Test coverage is improved for the edge cases ensuring that error handling logic behaves as expected.
