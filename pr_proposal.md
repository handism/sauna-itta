# 🧪 [testing improvement] Add comprehensive tests for VisitCompactItem

## 🎯 What
This pull request addresses the testing gap for the `VisitCompactItem` component located in `frontend/src/components/sauna-map/components/list/VisitCompactItem.tsx`.

## 📊 Coverage
The new tests cover the following scenarios:
* Correct rendering of the compact view with essential details (name, area).
* Verification that interaction buttons (expand/collapse toggle) are native and appropriately isolated from other action buttons (edit button) for accessibility purposes.
* Logic and conditional rendering for expand/collapse states (e.g. details, image previews, route link are only rendered on expand).
* Invocation checks for callbacks like hover, selection, deselection, tag clicks, and image previews, ensuring correct arguments are passed.
* Tests confirming the display of status indicators (e.g. "wishlist" tag).
* Conditional rendering based on missing/optional data like thumbnail images, area information, and comments.

## ✨ Result
The component test coverage for `VisitCompactItem.tsx` has been significantly improved, hitting 100% statement and branch coverage. The added tests ensure the safety net allows confident refactoring. Also ensured the mock variables strictly type check against the application data models.
