# 🧪 Testing Improvement: useVisitImportExport

## 🎯 What
Added unit tests for the `useVisitImportExport` hook, verifying both importing and exporting logic.

## 📊 Coverage
- `importVisitsFromFile`:
  - Throws on invalid JSON.
  - Throws on valid JSON that fails schema validation.
  - Successfully imports new, valid visits and updates state via `saveVisits`.
  - Skips duplicate visits (by `id`) and returns `{ added: 0 }`.
- `exportVisits`:
  - Creates an anchor element with the correct `href` (data URI) and `download` attribute.
  - Properly appends, clicks, and removes the element to trigger download.

## ✨ Result
Robust coverage for data import/export preventing regressions during refactoring, ensuring valid structure via Zod, and asserting correct mock behavior for browser globals like `document` and `FileReader`.
