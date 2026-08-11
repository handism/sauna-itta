# 🧹 [Code Health] Extract complex virtualized list setup to a custom hook

## 🎯 What
This PR addresses code health issues in `frontend/src/components/sauna-map/components/list/VisitList.tsx` by extracting the complex incremental rendering logic (often referred to as virtualized list setup) into a new custom hook, `useIncrementalList`.

## 💡 Why
`VisitList.tsx` was handling too many responsibilities, including its primary job of UI rendering and the low-level DOM intersection and scrolling logic required to lazily load and auto-scroll the visits list.
By extracting this complex setup into `useIncrementalList`:
*   **Maintainability**: `VisitList.tsx` becomes much cleaner and focused solely on what it renders. The file size and cognitive complexity are significantly reduced.
*   **Testability**: The incremental list logic (Intersection Observer behavior, chunked loading, selection scrolling) can now be tested in isolation inside `useIncrementalList.test.ts`, rather than relying solely on component-level DOM interaction tests.
*   **Reusability**: If similar "load more on scroll" behavior is needed elsewhere, the hook is ready to be reused.

## ✅ Verification
- Verified that all unit tests still pass, including the original `VisitList.test.tsx` which tests the component's integration with the incremental rendering behavior.
- Added comprehensive unit tests for the newly extracted `useIncrementalList` hook to ensure correct item chunking and `IntersectionObserver` mock handling.
- Ran `npm run lint` inside the `frontend` directory, which successfully passed after cleaning up unused imports in `VisitList.tsx`.

## ✨ Result
The codebase is cleaner, with better separation of concerns between state/intersection management and UI rendering. No external behavior or performance was changed, preserving existing functionality entirely.
