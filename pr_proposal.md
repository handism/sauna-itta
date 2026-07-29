# 🧹 Refactor to use Next.js Image component in VisitCompactItem

## 🎯 What
The code health issue addressed is the usage of an `eslint-disable-next-line @next/next/no-img-element` comment in `src/components/sauna-map/components/VisitCompactItem.tsx`. The standard `<img>` tag was replaced with the Next.js `<Image>` component.

## 💡 Why
This improves maintainability by adhering to Next.js best practices and removing the need to suppress ESLint warnings. It ensures images are handled consistently within the Next.js framework.

## ✅ Verification
I ran `npm run lint` and `npx vitest run` to ensure no functionality or existing rules were broken. I also confirmed styling is intact by maintaining the original class names and providing the explicit width and height derived from the CSS.

## ✨ Result
The eslint-disable rule is removed, resolving the linter warning properly, resulting in cleaner and more maintainable code.
