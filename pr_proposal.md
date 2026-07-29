# 🧹 Refactor SaunaMap component for better code health

## 🎯 What:
- Extracted `SaunaMapLayer` from `SaunaMapContent` into a separate file (`src/components/sauna-map/components/SaunaMapLayer.tsx`).
- Extracted the mobile pin hint UI into `MobilePinHint` (`src/components/sauna-map/components/MobilePinHint.tsx`).
- Removed unused imports and simplified the `SaunaMap.tsx` file.

## 💡 Why:
- The original `SaunaMapContent` function was too long and complex, handling high-level layout, leaflet components, and mobile specific hints in one place.
- Refactoring into smaller components separates concerns and significantly improves readability.
- The `SaunaMapContent` is now much easier to follow, orchestrating subcomponents rather than defining low-level leaflet markers and popup structures directly.

## ✅ Verification:
- Ran `npm run lint` which passed with no errors/warnings on the new components.
- Ran `npm test` successfully (all tests passed), confirming that no existing functionality was broken.
- Tested Map bounds logic typings during the refactor.

## ✨ Result:
- The overall size of `SaunaMap.tsx` dropped to 160 lines.
- Improved maintainability of the SaunaMap ecosystem without behavioral changes.
