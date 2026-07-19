# 🧪 Add tests for `toFormState` function

## 🎯 What
This PR addresses a gap in the test suite by adding tests for the `toFormState` function in `src/components/sauna-map/utils.ts`.

## 📊 Coverage
The new tests cover the following scenarios:
1. Converting a basic `SaunaVisit` without a `history` array to `VisitFormState`.
2. Using the latest history entry properties (`comment`, `image`, `date`, `rating`) when a `history` array is present.
3. Handling missing optional fields by providing expected default values (e.g., default `status`, `rating`, `tagsText`).
4. Correctly transforming the `tags` array into a comma-separated string.

## ✨ Result
Improved test coverage for `utils.ts`, ensuring that the form state logic and fallback behaviors continue to work correctly across future changes.
