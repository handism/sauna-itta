# 🔒 Fix missing runtime type validation for imported JSON data

## 🎯 What
Added runtime type validation to `importVisitsFromFile` hook using `zod`.

## ⚠️ Risk
When importing data from a JSON file, the application was using `JSON.parse(text) as SaunaVisit[]`. The `as` keyword just blindly forces a type cast, bypassing any actual checking. If a user was tricked into importing a malicious or malformed JSON payload, the application would have stored corrupted data and potentially crashed when attempting to map through unexpected shapes.

## 🛡️ Solution
Installed `zod` and created a schema for `SaunaVisit` mapping to the types interface exactly. Updated `importVisitsFromFile` to use `z.array(saunaVisitSchema).safeParse()` instead to ensure we only process perfectly validated `SaunaVisit` entries.
