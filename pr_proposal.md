# PR Proposal: Fix unapplied review feedback

## Description
This PR addresses several review feedback items that were missed in previous commits, particularly concerning design token usage in CSS and component usage in `SaunaMarkerPopup`.

## Changes Made
*   Replaced hardcoded rating colors (`#fbbf24`, `var(--primary)`) with the correct design token `var(--star-color)` in `.sauna-marker-pill--rating`, `.sauna-card-rating`, `.history-rating`, and `.share-rating`.
*   Fixed the `.wishlist-chip` and `.sauna-marker-pill--wishlist` colors to correctly use `var(--accent-wishlist)` and `#04241a` for improved contrast in light/dark themes.
*   Updated `SaunaMarkerPopup.tsx` to use the `VisitImagePreview` component instead of a raw `<Image>` tag with an `onClick` handler for accessibility (keyboard interaction).
*   Passed down `onOpenImage` from `useImageLightbox` down to `SaunaMarkerPopup` via `VisitMarkers`.
*   Updated `SaunaMarkerPopup.test.tsx` to handle the new `onOpenImage` behavior correctly.

## Verification
*   Ran all unit tests to ensure that `VisitMarkers` and `SaunaMarkerPopup` are rendering successfully without breaking regressions.
*   Verified that CSS rules and components pass the linter.
