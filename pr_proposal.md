# 🧪 Add tests for StatsHeader component

## 🎯 What
Added unit tests for the `StatsHeader` component to ensure its rendering and interactive logic works correctly.

## 📊 Coverage
The following scenarios are now tested:
- The header title renders correctly.
- The back link renders correctly by default.
- The back link does not render when `showBackLink` is false.
- The theme toggle button renders correctly when `theme` and `onToggleTheme` are provided, and clicking it triggers the callback.
- The correct theme toggle label (for "dark" vs "light") is rendered.
- The theme toggle button is not rendered when `onToggleTheme` is missing.

## ✨ Result
Improved test coverage for `StatsHeader` component, ensuring the header rendering and theme toggle interaction function correctly and won't regress in future changes.
