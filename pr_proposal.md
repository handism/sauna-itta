# 🧹 [Code Health] Use Zod schema for validation instead of custom logic

## 🎯 What
Replaced the custom type guard logic in `isValidVisit` (inside `src/components/sauna-map/utils.ts`) with Zod schema validation using `SaunaVisitSchema`.

## 💡 Why
The application already uses `SaunaVisitSchema` elsewhere (e.g. `useVisitImportExport.ts`). Utilizing the existing Zod schema for validation in `isValidVisit` removes redundant, hard-to-maintain manual checking and improves overall code robustness and consistency.

## ✅ Verification
- Ran format and lint checks (`npm run lint`), which passed.
- Ran the test suite (`npx vitest run`), which confirmed 34 tests passed and no regressions were introduced.

## ✨ Result
A simpler, shorter, and more robust `isValidVisit` function that correctly validates user sauna visits via Zod.
