# 🧹 Remove `any` type usage in utils.test.ts

## 🎯 What
Replaced the use of `any` when mocking `global.FileReader` in `src/components/sauna-map/utils.test.ts` with `unknown as typeof FileReader`.

## 💡 Why
Using `any` completely disables TypeScript's type checking. Using `unknown as typeof FileReader` is a safer way to mock the global object without resorting to `any`, improving the type safety and code health of the test suite.

## ✅ Verification
- Ensured the tests continue to pass using `npm test`.
- Verified that no new linting errors were introduced with `npm run lint`.

## ✨ Result
Improved type safety in the test file without modifying or breaking any application behavior.
