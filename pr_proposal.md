# 🧹 Split overloaded useVisitForm hook

## 🎯 What
The `useVisitForm` hook in `frontend/src/components/sauna-map/hooks/` was overloaded, taking on responsibilities for both form state management (including image uploading) and CRUD operations via the backend API. This PR splits it into two specialized hooks:
1. `useVisitFormState`: Manages the form state, validation context (formRef), and image handling.
2. `useVisitCrud`: Manages the API calls for creating, editing, and deleting sauna visits and their history entries.

It also updates `EditorContext.tsx` to integrate these two new hooks and splits the existing unit test file into `useVisitFormState.test.ts` and `useVisitCrud.test.ts`.

## 💡 Why
Splitting this overloaded hook vastly improves maintainability and separation of concerns. The state management piece can be reasoned about (and tested) entirely independently from the side effects of saving and deleting data. This reduces complexity and makes each individual hook smaller and easier to extend in the future.

## ✅ Verification
- All tests in `frontend/` were executed and pass.
- Linting (`npm run lint`) and typechecking (`npm run typecheck`) were run with 0 errors.
- The `EditorContext.tsx` has identical inputs and exports to consuming components. No side-effects or regressions have been introduced into the context logic.

## ✨ Result
A cleaner, more modular hook structure for the Visit form, leading to higher codebase quality without breaking or altering application behavior.
