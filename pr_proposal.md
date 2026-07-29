# 🧪 [Testing] Add tests for getInitialIsMobile in theme.ts

## 🎯 What
The `getInitialIsMobile` function in `src/components/sauna-map/utils/theme.ts` was previously untested. This function is critical for preventing hydration errors by ensuring a predictable initial state (PC width) during SSR and falling back to actual window width upon mounting.

## 📊 Coverage
Added a new test block `describe("getInitialIsMobile")` in `theme.test.ts` which covers:
- **SSR environment**: `window` is `undefined` -> returns `false`.
- **Desktop environment**: `window.innerWidth >= MOBILE_BREAKPOINT` -> returns `false`.
- **Mobile environment**: `window.innerWidth < MOBILE_BREAKPOINT` -> returns `true`.

## ✨ Result
Increased test coverage for `src/components/sauna-map/utils/theme.ts`. The behavior for mobile/desktop breakpoints and SSR fallback is now deterministically tested without flakiness using Vitest's `vi.stubGlobal`.
