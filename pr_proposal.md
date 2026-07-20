# 🧹 [Code Health] Use Next.js Image component in VisitMarkers

## 🎯 What
Replaced the native HTML `<img>` element with the Next.js `<Image>` component in `src/components/sauna-map/components/VisitMarkers.tsx`.

## 💡 Why
Using the Next.js `<Image>` component is the recommended approach for images in Next.js applications. It provides built-in benefits (even when unoptimized is true, as configured here) and resolves the ESLint warning `@next/next/no-img-element` without needing a suppression comment. This improves code maintainability and aligns with framework best practices.

## ✅ Verification
- Checked that the code compiles without errors.
- Ran `npm run lint` to ensure no linting warnings remain.
- Ran `npx vitest run` to verify that existing test suites still pass.

## ✨ Result
The codebase now adheres strictly to Next.js image best practices, removing an ESLint suppression comment and paving the way for future optimizations if `unoptimized` is toggled off.
