# 🧪 Testing Improvement: Add unit tests for TagCloudCard

## 🎯 What
The `TagCloudCard` component, which renders the most frequently used sauna tags from visit history, lacked unit tests. This PR introduces comprehensive tests for the component.

## 📊 Coverage
- **Empty state handling:** Ensures the component renders `null` and nothing is output when no visits have valid tags.
- **Correct counts & highlighting:** Verifies that tag links contain the correct `href`, display accurate counts, and apply the "popular tag" styling correctly (when counts meet the threshold `ceil(maxCount * 0.6)`).
- **Status exclusion:** Confirms that visits marked as "wishlist" are properly ignored and only actual visited tags are processed.

## ✨ Result
Test coverage is improved for the stats UI, increasing our confidence against future regressions when modifying tag visualization logic or link routing.
