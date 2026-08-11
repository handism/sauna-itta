# 🧹 [Code Health] Abstract State Initialization in useSaunaVisits

## 🎯 What
The code health issue addressed is the "Complex State Management" inside `useSaunaVisits.ts`. The inline logic for handling seeded storage and initialization of `visits` has been separated out into a dedicated `useInitialVisits` hook.

## 💡 Why
This improves readability and maintainability by keeping the `useSaunaVisits` hook smaller and more focused on API orchestration. The new `useInitialVisits` custom hook isolates local state setup. This aligns better with the repository pattern and improves separation of concerns.

## ✅ Verification
- All tests passing correctly, including the `useSaunaVisits.test.ts`.
- Evaluated linter, ensuring there are no unused dependencies, or missing hook dependencies due to refactorings.

## ✨ Result
The codebase maintainability is improved without changing behavior.
