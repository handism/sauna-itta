# 🧪 Add tests for SummaryGrid component

## 🎯 What
Added missing unit tests for the `SummaryGrid` component in the stats page to verify its rendering logic.

## 📊 Coverage
- **Happy Path:** Validates that all statistic fields (total, visited/wishlist, areas, average rating, prefectures, and record period) render correctly with full data.
- **Edge Cases:** Validates that when data is empty or zero (e.g. `avgRating` is 0, dates are null), the component safely renders fallback strings like `-`.

## ✨ Result
Increased test coverage for the stats page's UI components, ensuring robustness against future refactoring and data edge cases.
