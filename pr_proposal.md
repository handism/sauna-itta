# Title: 🧹 [Code Health] Remove "any" type usage in utils.test.ts

## 🎯 What
Replaced usages of the `any` type with `unknown` in `src/components/sauna-map/utils.test.ts` (specifically `MockFileReader as unknown as typeof FileReader` and `"invalid" as unknown`). Removed the file-level eslint disable directive for `@typescript-eslint/no-explicit-any`.

## 💡 Why
Using `any` disables TypeScript's type checking, hiding potential errors and making the code less maintainable. By replacing it with `unknown`, we ensure better type safety and conform to modern TypeScript best practices without altering test behavior. Removing the unnecessary eslint-disable directive cleans up the file.

## ✅ Verification
- Ran `npm run lint` and ensured there are no errors or unused directive warnings.
- Ran `npx vitest run` and ensured all tests pass successfully.

## ✨ Result
Improved type safety and cleaner code in the test suite, making the file fully compliant with ESLint rules without the need for exceptions.
