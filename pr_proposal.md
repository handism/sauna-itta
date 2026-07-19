# 🧪 Add tests for buildHistoryUpdate

## 🎯 What:
The `buildHistoryUpdate` function in `src/components/sauna-map/utils.ts` was untested. It handles the logic for appending vs updating history entries and fallback values. This PR adds unit tests for this function.

## 📊 Coverage:
The new tests cover the following scenarios:
- Appending a new history entry when `appendHistory` is true.
- Updating the latest history entry when `appendHistory` is false.
- Using fallback values (e.g., today's date) when form fields are falsy.
- Correctly calculating `visitCount` when it is missing or larger than the history length.

## ✨ Result:
The `buildHistoryUpdate` function is now fully tested, ensuring its logic for generating history updates is reliable and regression-free.
