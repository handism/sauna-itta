# 🧹 Remove eslint-disable for next/image

## 🎯 What
Replaced native `<img>` tags with Next.js `<Image>` component in `VisitImagePreview`, `VisitCompactItem`, and `ImageLightbox` to resolve the ESLint warning `@next/next/no-img-element`.

## 💡 Why
Using the Next.js `Image` component is standard practice in Next.js applications and avoids ignoring linting rules, resulting in a cleaner and more maintainable codebase.

## ✅ Verification
- Checked that styles remain intact by preserving original CSS classes (`sauna-img-preview`, `sauna-compact-thumb`, `image-lightbox-img`).
- Executed `npm run lint` and `npm test` successfully.
- Verified rendering behavior is unchanged.

## ✨ Result
The `eslint-disable` directives are removed, improving overall code health and adherence to standard Next.js practices.
