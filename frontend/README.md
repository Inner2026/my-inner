# My Inner — Frontend

React + TypeScript + Vite + Tailwind CSS v4 SPA.

## Scripts

- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the production build locally

## Structure

```
src/
├── api/          typed fetch client + per-module endpoint wrappers
├── context/      AuthContext (JWT stored in localStorage, attached to every request)
├── components/   NavBar, ProtectedRoute
├── pages/        Landing, TestCatalog, TestDetail, Register, Login,
│                 CheckoutSuccess, Instructions, TestRunner, ResultPage, Dashboard
├── admin/        Admin SPA (test/version CRUD, JSON bulk question editor,
│                 result definition editor, read-only users/purchases/attempts)
└── types/        shared TS interfaces mirroring backend API shapes
```

## Notes

- The frontend **never** calculates a score — `TestRunner` only collects
  `{questionId, answerOptionId}` pairs and posts them to `/attempts/:id/submit`.
- `CheckoutSuccess` does not trust the Stripe redirect itself; it polls
  `/purchases/:id` until the backend reports `status: 'paid'` (which only
  happens after the backend has verified Stripe's webhook).
- The admin question editor is a JSON bulk editor rather than one form per
  question — this is what makes authoring a 93-question test practical. A
  read-only list below it lets you sanity-check what's currently saved.
- Not yet built: this admin UI is functional but intentionally minimal (per
  the "prioritize functionality over visual polish" instruction for admin
  tooling) — there is no drag-to-reorder, no per-question form UI, and no
  bulk CSV import; the JSON editor covers the same ground with less code.
