# 🧪 [Testing] Add edge case tests for toNormalizedTags

## Description
This PR addresses a testing gap by adding missing edge case tests for the `toNormalizedTags` function in `src/components/sauna-map/utils.ts`.

### 🎯 **What:**
The `toNormalizedTags` function lacked test coverage. It's a pure function that splits strings into tags by comma separation.

### 📊 **Coverage:**
The added test cases cover the following scenarios:
- Basic comma-separated string splitting
- Trimming of extra spaces around tags
- Empty string input
- Inputs with consecutive commas and leading/trailing commas
- Inputs containing only spaces and commas
- Inputs consisting of a single tag without commas

### ✨ **Result:**
The test coverage for `src/components/sauna-map/utils.ts` has been improved, ensuring the `toNormalizedTags` function behaves deterministically across a full range of expected valid and edge case inputs.
