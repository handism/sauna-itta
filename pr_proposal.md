# 🧪 Add tests for `useEditorState` hook

## 🎯 What
This PR addresses the missing test coverage for the `useEditorState` custom React hook located in `frontend/src/components/sauna-map/hooks/useEditorState.ts`.

## 📊 Coverage
A comprehensive test suite was added (`frontend/src/components/sauna-map/hooks/useEditorState.test.ts`) that verifies the following behaviors:
* **Initial State:** Proper state initialization for both desktop and mobile environments.
* **State Transitions:** Correct reducer updates for actions including `startCreate`, `startEdit`, `selectLocation`, `cancelEdit`, and `toggleSidebar`.
* **Sidebar Logic:** Ensures the `isSidebarExpanded` state appropriately collapses and expands based on device type (mobile vs. desktop) during mode changes.
* **Cleanup:** Uses `cleanup()` from React Testing Library properly in `afterEach` teardowns to avoid state leakage.

## ✨ Result
The hook now has 13 dedicated unit tests, achieving ~95% statement and line coverage. Only the unreachable default branch of the internal reducer remains untested through the public hook API. This ensures that any future refactoring of the map editor state management can be done with confidence.
