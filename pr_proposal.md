## 🧹 Remove `any` types in utils.test.ts

### 🎯 What:
Removed the usage of the `any` type in the `src/components/sauna-map/utils.test.ts` test file. Specifically:
* Removed the global `/* eslint-disable @typescript-eslint/no-explicit-any */` disable comment at the top of the file.
* Replaced `as any` casting for the MockFileReader with `as unknown as typeof FileReader`.
* Replaced `as any` casting for the invalid history test case with `as unknown as SaunaVisit["history"]`.

### 💡 Why:
Using `any` disables TypeScript's static type checking, which can lead to uncaught errors and makes the code harder to maintain and understand. Replacing `any` with specific types (using `as unknown as [SpecificType]` for mocks) restores type safety and allows the TypeScript compiler to properly validate the code. Removing the global disable comment ensures that future code added to this file will adhere to the strict linting rules regarding explicit `any` types.

### ✅ Verification:
* Confirmed that `npm run lint` passes without any errors related to `@typescript-eslint/no-explicit-any`.
* Confirmed that all unit tests (`npx vitest run src/components/sauna-map/utils.test.ts`) still pass successfully after the refactor.
* Code review verified the approach is safe and complete.

### ✨ Result:
Improved type safety and code health within the test suite, enforcing stricter typing standards and removing reliance on the type-bypassing `any` keyword.
