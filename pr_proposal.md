# PR Proposal: ⚡ Optimize VisitMarkers array iteration

## 💡 What
This PR optimizes the array filtering logic in `VisitMarkers.tsx`. The component was previously iterating through the `visits` array on every render using `forEach` to split it into `normalVisits` and `priorityVisits`. This logic has been wrapped in a `useMemo` hook, ensuring it only recalculates when `visits`, `selectedId`, or `editingId` changes. The `forEach` was also converted to a standard `for` loop for an additional micro-optimization.

To satisfy the React Rules of Hooks, the early return for `!enableClustering` was moved after the `useMemo` calculation.

## 🎯 Why
In a map with many markers (e.g. dense user history), the O(N) array iteration runs on every render, even for state changes that don't affect the split (such as when `hoveredId` changes). This caused unnecessary CPU work on the main thread and slowed down map interactions.

## 📊 Measured Improvement
A benchmark was added (`VisitMarkers.benchmark.test.tsx`) measuring repeated rerenders when `hoveredId` changes, using a mock dataset of 10,000 visits.

*   **Baseline (Avg Rerender):** ~311ms
*   **Optimized (Avg Rerender):** ~273ms

This yields an ~12% decrease in rendering time for hover state changes on extremely dense datasets, improving the responsiveness of UI elements tied to hover events on the map.
