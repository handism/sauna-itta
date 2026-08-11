# 🧪 Add tests for MapZoomControl

## 🎯 What
This PR addresses the testing gap in `MapZoomControl` by writing the missing test suite. Previously, this component which handles map zoom functionality lacked tests to verify its core interactions.

## 📊 Coverage
- Covered standard rendering paths (both Zoom In and Zoom Out buttons are rendered correctly).
- Covered interaction logic by explicitly mocking the `useMap` hook from `react-leaflet` to test that clicking "拡大" calls `map.zoomIn()` and clicking "縮小" calls `map.zoomOut()`.
- Validated state isolation and appropriate teardown/cleanup logic via `beforeEach` and `afterEach`.

## ✨ Result
The test coverage for `frontend/src/components/sauna-map/components/map/MapZoomControl.tsx` has significantly improved, now reaching 100% on Functions, Statements and Lines coverage metrics. These new tests act as a regression safety net ensuring future updates won't inadvertently break the zoom controls.
