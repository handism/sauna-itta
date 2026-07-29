# 🧪 Add tests for ChartEmptyState component

## 🎯 What
The `ChartEmptyState` component was previously untested. This PR introduces a test suite to ensure its structural integrity and proper rendering of props.

## 📊 Coverage
The following scenarios are now covered:
- Renders the correct text message passed as a prop.
- Renders the provided LucideIcon with correct properties (`size={32}` and `aria-hidden="true"`).
- Applies the expected `.chart-empty-state` CSS class to the outer wrapper `div`.

## ✨ Result
Improved unit test coverage for the `src/components/charts/` module, increasing reliability when changing the UI logic inside `ChartEmptyState`.
