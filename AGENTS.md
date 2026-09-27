# AGENTS.md

Instructions for AI coding agents working in this repository.
Read this file first. Keep it short — it is loaded into every session through
the `@AGENTS.md` import in `CLAUDE.md`, whose harness load-check line must stay
intact.

For the human-facing project explanation, see `README.md`.

---

## Project

Shamanicca — headless e-commerce storefront. Next.js reads WordPress/WooCommerce
through WPGraphQL. Checkout hands off to WooCommerce. Cart and wishlist are
client-only, persisted to `localStorage`.

GraphQL endpoint: `https://master.shamanicca.com/graphql`
Deployed on Vercel from `main`.

---

## Stack

Next.js (**Pages Router**) · React 18 · TypeScript · Apollo Client +
`graphql-request` → WPGraphQL · Tailwind CSS v4 (`@tailwindcss/postcss`, no
Preflight) + plain layered CSS · Vitest + Testing Library + jsdom.

Exact versions live in `package.json`; the Node version lives in `.nvmrc` and
drives CI. Read those rather than trusting a number written here.

**Pages Router, not App Router.** Do not introduce `app/`, Server Components,
`use client`, or server actions. If a task seems to need them, stop and ask.

---

## Commands and the completion gate

```bash
npm run dev        # localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest
npm run build      # production build — NOT the completion gate, see below
```

**Completion gate:** `npm run lint && npm run typecheck && npm run test`.

Do not run `npm run build` as proof of correctness. `next build` fetches the
live WPGraphQL endpoint, which is bot-protected and unreliable outside Vercel.
The build is verified by the Vercel preview attached to every PR.

A passing `dev` server is not evidence of anything. For any change that alters
what the user sees, the gates are necessary but not sufficient — visual
confirmation is required — see `docs/VISUAL-VERIFICATION.md`.

CI (`.github/workflows/ci.yml`, job `verify`) runs the same three gates on push
to `main`, on PRs targeting `main`, and on `workflow_dispatch`. Pushing a
feature branch alone runs nothing. Lint fails on errors only; warnings are not
gated (see Known debt).

**Branching:**

```bash
git switch -c <branch> --no-track origin/main   # new branch from main
git push -u origin HEAD                          # first push, always
```

Without `--no-track` the branch tracks `origin/main`, so `git push` targets
`main` and skips the PR.

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
├── hooks/
├── lib/
│   ├── graphql/    apolloClient.ts, queries.ts, types.ts, utils.ts
│   ├── context/    cart, wishlist, cookieConsent
│   └── api/        woocommerce.ts
├── styles/         Tailwind v4 tokens + plain layered CSS
├── test/
├── types/          Ambient/global declarations only — see type rule below
└── utils/          Pure functions only
```

**Placement rule:** a new component goes in the lowest layer that fits.
If it imports another component, it is not an atom.

**Type location:** WPGraphQL response shapes go in `src/lib/graphql/types.ts`.
`src/types/` is for ambient and global declarations only — never query shapes.

---

## Conventions

- **Exports.** New components use named exports; pages keep a default export.
  Every existing component uses `export default` — do not convert them. An
  export change is a public API change; see hard rule 1.
- **Props** are typed with `type XProps = { ... }` declared above the component.
  This codebase uses `type`, not `interface`.
- **Do not use `any`.** Type WPGraphQL shapes in `src/lib/graphql/types.ts`.
- **WordPress HTML** must pass through `isomorphic-dompurify` before reaching
  `dangerouslySetInnerHTML`. No call site does this yet (see Known debt) —
  apply it in new code. Excerpt cleanup lives in `utils/html.ts`.
- Anything touching `localStorage` must guard for SSR and respect the
  `hydrated` flag pattern. Reading storage during render causes hydration
  mismatch — this has already broken the cart badge once.
- Analytics stays behind Consent Mode v2. Never fire `gtag` before consent.
- New env vars: add to `.env.example` with a comment. `NEXT_PUBLIC_` means
  the browser can read it — no secrets.
- **Commits** follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
  `ci:`, `test:`, optional scope). One responsibility per commit — two changes
  in the same file are still two commits if they are two concerns.

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
7. **Commit.** Stage and describe the diff instead.
8. **Write any file during a READ or analysis task** — a report included.
   Findings go in the conversation. If a destination path is wanted, you will
   be given one.
9. **Touch anything under Known debt**, or any unrelated problem you notice
   while working. Report it and continue with the assigned scope. This includes
   pre-existing `any`, default exports, and unused dependencies.
10. **Modify CSS consumed by the WordPress/PHP theme (checkout)** — never, even
    when instructed. No file in this repo may feed it. Verify this in the READ
    with evidence (grep of imports / build outputs), never by assumption.

---

## Known debt

- **All components use `export default`.** The named-export convention above
  applies to new components only.
- **~100 lint warnings**, mostly `@typescript-eslint/no-explicit-any`, and a
  `@types/react` ^19 against `react` 18.3.1 mismatch. Type errors from that
  mismatch are pre-existing, not caused by your change.
- **`isomorphic-dompurify` is installed but imported nowhere**, while 10+ files
  inject raw WordPress HTML through `dangerouslySetInnerHTML`. Tracked as its
  own task.
- **`@mantine/*` and `embla-carousel-react` are declared dependencies but unused**
  in `src`. The product gallery is a hand-rolled scroll carousel.

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

## Styling architecture

The SCSS → Tailwind/CSS migration is complete: Phase 9h merged in
[PR #48](https://github.com/maubayuelo/shamanicca-ecommerce-graphQL/pull/48),
merge `362bb921`. Sass is removed. Tailwind v4 runs through
`@tailwindcss/postcss`; tokens live in `src/styles/tailwind.css`
(`@theme`). **Preflight remains OFF.**

`src/styles/layers.css` is imported first in `_app.tsx` and declares:
`properties, theme, base, cms, components, utilities`. Preserve this order.

- CMS/WordPress HTML scopes (`.wp-content`, `.post-content`, `.page img`)
  are plain CSS in `@layer cms`.
- Shared primitives (`.type-*`, `.btn*`, `.form-control*`, helpers) are
  plain rules in `@layer components`, preserving their original selectors.
  Never add a helper whose name Tailwind also generates.
- Preserve exact colors and spacing. Use an existing project token only when
  it renders the exact value; otherwise keep the literal, never a nearest
  default shade. Keep the scoped breakpoint exceptions in `CLAUDE.md`.
- The contract remains zero unintended visual change, proven per
  `docs/VISUAL-VERIFICATION.md`. Earlier approved breakpoint shifts are
  historical decisions, not permission for further shifts.
- Preflight, capture hooks → `data-*`, a z-index scale and hover gating
  remain separate work; migration completion does not authorize them.

Housekeeping proceeds only within the approved cleanup scope. Preserve the
reusable visual regression tooling, fixtures and media-cache contract.
