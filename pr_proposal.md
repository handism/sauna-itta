# 🧹 Code Health Improvement: Fix usage of "any" type in tests

## 🎯 What:
Replaced the `any` type casting with the standard TypeScript `unknown` escape hatch (`as unknown as Type`) in `src/components/sauna-map/utils.test.ts`. This specific fix was applied to the `history: "invalid"` mock that was triggering static analysis, and proactively applied to `global.FileReader` mocks. The redundant `/* eslint-disable @typescript-eslint/no-explicit-any */` comment was removed.

## 💡 Why:
Relying on the `any` type bypasses TypeScript's compiler checks, reducing code safety and obscuring type errors. By using `unknown`, we ensure type safety is maintained. Removing unnecessary eslint disable directives improves overall code quality and ensures the codebase adheres strictly to linting standards (`@typescript-eslint/no-explicit-any`).

## ✅ Verification:
- Ran `npm test` successfully (all 44 tests in `utils.test.ts` passed).
- Ran `npm run lint` successfully (0 errors, proving the eslint-disable directive was successfully removed).

## ✨ Result:
The codebase is now fully compliant with linting rules regarding the `any` type, without degrading testing capabilities or functionality.
