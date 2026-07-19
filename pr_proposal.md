🎯 **What:** The code health issue addressed
Refactored the `calculateStats` function in `src/components/sauna-map/utils.ts` to break down its complex `reduce` logic into smaller, dedicated helper functions (`getUniqueAreasCount`, `getPrefectures`, and `getDateAndRatingStats`).

💡 **Why:** How this improves maintainability
The single `reduce` loop was overly dense and handled multiple unrelated statistics (e.g. area count vs. date ranges vs. average ratings) in one pass. Extracting these calculations into separate, purely functional helper functions significantly improves code readability and modularity.

✅ **Verification:** How you confirmed the change is safe
Ran existing unit tests via Vitest (`npm run test`) which cover `calculateStats` functionality. Also ran ESLint (`npm run lint`). Code review returned `#Correct#`.

✨ **Result:** The improvement achieved
A cleaner and easily readable `calculateStats` function whose state matches the exact same structure as the previous implementation, without any functionality regressions.
