# 🧹 Remove "any" type usage in utils.test.ts

## Description
🎯 **What:** Removed instances of the `any` type in `src/components/sauna-map/utils.test.ts` and the corresponding `eslint-disable` comment at the top of the file.
💡 **Why:** Using `any` bypasses TypeScript's type checking, which can lead to runtime errors and reduces code maintainability. Replacing `any` with `unknown` or specific type assertions improves type safety and code clarity.
✅ **Verification:** Verified by running `npm run lint` and `npx vitest run`. Both pass without errors, confirming the changes are safe and no regressions were introduced.
✨ **Result:** Improved type safety and resolved a linting/code-health issue without altering the underlying test functionality.
