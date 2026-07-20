# 🧹 Code Health Improvement: Flatten deeply nested conditionals in VisitCalendar

## 🎯 What
Refactored `tileContent` and `tileClassName` in `src/app/stats/components/VisitCalendar.tsx` to use early returns instead of deeply nested conditionals.

## 💡 Why
This improves the readability and maintainability of the codebase by reducing nesting and cyclomatic complexity.

## ✅ Verification
- Checked file changes locally.
- Ran `npm run lint` and `npx vitest run` to ensure no functionality is broken.

## ✨ Result
The `VisitCalendar.tsx` file now has simpler, flatter logic for its calendar tiles while preserving all previous behavior.
