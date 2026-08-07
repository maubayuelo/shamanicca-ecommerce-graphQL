# AGENTS.md

Instructions for AI coding agents working in this repository.
Read this file first. Keep it short — it is loaded every session.

For the human-facing project explanation, see `README.md`.
For the in-flight Tailwind migration, see `docs/MIGRATION-TAILWIND.md`.

---

## Project

Shamanicca — headless e-commerce storefront. Next.js reads WordPress/WooCommerce
through WPGraphQL. Checkout hands off to WooCommerce. Cart and wishlist are
client-only, persisted to `localStorage`.

Production: https://shamanicca-ecommerce.vercel.app
GraphQL endpoint: `https://master.shamanicca.com/graphql`

---

## Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js, **Pages Router** (`src/pages/`) | 15.5 |
| Runtime | React | 18.3.1 |
| Language | TypeScript | 5.x |
| Data | Apollo Client + `graphql-request` → WPGraphQL | 4.0 / 7.2 |
| Styling | SCSS (being migrated to Tailwind) | sass 1.89 |
| Components | Mantine (carousel only) | 8.3.6 |
| Tests | Vitest + Testing Library + jsdom | 1.6.1 |
| Deploy | Vercel | — |

**Pages Router, not App Router.** Do not introduce `app/`, Server Components,
`use client`, or server actions. If a task seems to need them, stop and ask.

---

## Commands

```bash
npm run dev        # localhost:3000
npm run build      # production build — the real correctness gate
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest
```

Before declaring any task complete: `npm run typecheck && npm run build`.
A passing `dev` server is not sufficient evidence.

---

## Directory map

```
src/
├── pages/          Route = file. API routes in pages/api/.
├── components/     Atomic Design — see rule below
│   ├── atoms/      Single purpose, no children components
│   ├── molecules/  2–3 atoms
│   ├── organisms/  Header, Footer — self-contained, stateful
│   └── sections/   Full page bands: Hero, ProductsGrid, BlogGrid
├── lib/
│   ├── graphql/    apolloClient.ts, queries.ts, utils.ts
│   ├── context/    cart, wishlist, cookieConsent
│   └── api/        woocommerce.ts, wp.ts, stripe.ts (legacy)
├── styles/         SCSS — migration target
├── types/
└── utils/          Pure functions only
```

**Placement rule:** a new component goes in the lowest layer that fits.
If it imports another component, it is not an atom.

---

## Conventions

- Named exports for components. Default export only for pages.
- Props typed with an explicit `interface`, declared above the component.
- Do not use `any`. If a WPGraphQL shape is unknown, add it to `src/types/`.
- WordPress HTML goes through `isomorphic-dompurify`, never straight into
  `dangerouslySetInnerHTML`. Excerpt cleanup lives in `utils/html.ts`.
- Anything touching `localStorage` must guard for SSR and respect the
  `hydrated` flag pattern. Reading storage during render causes hydration
  mismatch — this has already broken the cart badge once.
- Analytics stays behind Consent Mode v2. Never fire `gtag` before consent.
- New env vars: add to `.env.example` with a comment. `NEXT_PUBLIC_` means
  the browser can read it — no secrets.

---

## Hard rules

Do not, without an explicit instruction saying so:

1. **Change component public APIs.** Prop names and shapes stay identical
   during any refactor.
2. **Touch `src/lib/graphql/queries.ts`.** Query changes are a separate task
   with their own review.
3. **Rename or move files** during a styling task.
4. **Migrate frameworks or add dependencies.** Propose first, wait.
5. **Read `package-lock.json`.** It is large and tells you nothing.
6. **Edit `.env.local`** or print secret values.
7. **Commit** unless asked. Stage and describe the diff instead.

---

## Known debt

Flag these if you touch nearby code. Do not fix them opportunistically.

- **`@types/react` is ^19 while `react` is 18.3.1.** Type errors from this
  mismatch are pre-existing, not caused by your change.
- **`lib/api/stripe.ts` is legacy.** Checkout goes through WooCommerce.
- **Mantine is used for one thing** — the product page carousel. `embla-carousel-react`
  is already a direct dependency; drop Mantine as part of the SCSS→Tailwind
  migration, not as a standalone change.

---

## Working style

- Work in **one phase at a time** and stop at the end of each for review.
- Show the diff before applying anything that spans more than one file.
- When a task is ambiguous, ask one question rather than guessing and
  producing a large diff that has to be thrown away.
- Prefer the smallest change that satisfies the requirement.
- Do not add comments explaining what the code obviously does. Comment only
  non-obvious constraints (hydration, consent gating, WP data quirks).

---

## Current focus

Migrating SCSS → Tailwind CSS. Read `docs/MIGRATION-TAILWIND.md` before
touching anything in `src/styles/` or any `className`. The migration has
phases and gates; do not skip ahead.