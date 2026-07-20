# 🧪 [testing improvement] Add tests for sanitizeImageUrl

## Description
- 🎯 **What:** The testing gap for the `sanitizeImageUrl` utility function in `src/components/sauna-map/utils.ts` has been addressed. The function is pure and didn't have test coverage before.
- 📊 **Coverage:** The test covers falsy inputs, valid HTTP/HTTPS URLs, relative/absolute paths, valid `data:image/*` URLs, invalid `data:` URLs (e.g., HTML), dangerous protocols (e.g., `javascript:`, `file:`), and unparseable URLs.
- ✨ **Result:** Test coverage and reliability of the `sanitizeImageUrl` utility function have significantly improved, preventing potential regressions.
