# 🧹 Refactor useVisitCRUD hook by extracting pure functions

## 🎯 What
Refactored `src/components/sauna-map/hooks/useVisitCRUD.ts` to extract internal callback functions (`createVisit`, `updateVisit`, and the history removal mapping logic) into top-level pure functions (`createNewVisit`, `getUpdatedVisits`, `getVisitsWithRemovedHistory`).

## 💡 Why
The `useVisitCRUD` hook was becoming too long and complex due to inline data transformation logic inside React `useCallback` hooks. By extracting these into pure functions outside the hook, the code becomes much more readable, easier to test in isolation, and the React hook itself only manages the side effects (calling `saveVisits`) and state updates.

## ✅ Verification
Ran `npm run lint` and `npm run test` (Vitest) successfully. Verified that all components and hooks relying on `useVisitCRUD` still pass their unit tests without modification.

## ✨ Result
The file `useVisitCRUD.ts` is now cleaner and strictly separated into pure data transformation functions and a much shorter, focused custom React hook.
