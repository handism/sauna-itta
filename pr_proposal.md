# 🔒 Security Fix: Prevent crashes from `localStorage` errors in restricted environments

## 🎯 What
The `localStorage.setItem` call in `src/components/sauna-map/SaunaMap.tsx` and `localStorage.getItem` calls in `src/components/sauna-map/utils.ts` were previously unhandled. This PR wraps these `localStorage` access points in `try...catch` blocks.

## ⚠️ Risk
If the browser's storage is disabled (e.g., due to user privacy settings blocking third-party storage, or running in certain restricted incognito modes) or if the storage quota is exceeded, these `localStorage` methods can throw synchronous exceptions (such as `SecurityError` or `QuotaExceededError`). Without error handling, these exceptions would crash the application or break core component functionality (like theme switching or app initialization).

## 🛡️ Solution
All direct interactions with `localStorage` have been wrapped in `try...catch` blocks. When an error is caught:
* In `SaunaMap.tsx` during `toggleTheme`, a warning is logged, allowing the application state to still update correctly for the session without persisting it.
* In `utils.ts` for initialization logic, a warning is logged, and sensible defaults (the default theme or default visits) are safely returned to ensure the application starts without failure.
