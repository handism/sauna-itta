# PR Proposal: Refactor array joins to template literals

## Description
This PR refactors array `.join()` calls to template literals for performance improvements in `geocoding.ts`.
It avoids unnecessary array allocations and correctly uses the nullish coalescing operator (`??`) to handle optional fields securely without stringifying `undefined` values.

## Changes
- **`src/components/sauna-map/utils/geocoding.ts`**: Converted `formatJapaneseAddress` to use template literals with `??`.
