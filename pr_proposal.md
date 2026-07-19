# 🧪 Add edge case test for calculateStats in utils.ts

## 🎯 What
Added missing edge case tests in `calculateStats` inside `src/components/sauna-map/utils.test.ts`. This ensures correct calculation when `area` is purely whitespace or missing completely, and when the visit `date` is an empty string.

## 📊 Coverage
- An entry with empty string `date` ("") and whitespace `area` ("   ").
- An entry with a valid `date` but missing `area` field entirely.
This covers the reducing logic specifically handling `(visit.area ?? "").trim()` and the empty `date` comparison `entry.date.localeCompare(acc.firstDate)`.

## ✨ Result
Increased test coverage and confidence in `calculateStats` handling potentially bad or malformed data cleanly without altering intended stat results (like calculating unique areas).
