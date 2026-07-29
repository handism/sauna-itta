# 🧪 Testing Improvement: applyThemeClass

## 🎯 What
Added unit tests for the `applyThemeClass` function in `src/components/sauna-map/utils/theme.ts`. Previously, this function lacked test coverage.

## 📊 Coverage
The following scenarios are now covered:
- Adding the `light-theme` class to `document.documentElement` when the theme is `"light"`.
- Removing the `light-theme` class from `document.documentElement` when the theme is `"dark"`.

## ✨ Result
Test coverage for `src/components/sauna-map/utils/theme.ts` has improved, ensuring changes to theme application logic are verified and robust against regressions.
