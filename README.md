[![CI](https://github.com/maubayuelo/shamanicca-ecommerce-graphQL/actions/workflows/ci.yml/badge.svg)](https://github.com/maubayuelo/shamanicca-ecommerce-graphQL/actions/workflows/ci.yml)

# Shamanicca — E-Commerce Storefront

A modern e-commerce storefront for **Shamanicca**, built with **Next.js 15**, **React 18**, **TypeScript 5**, **Apollo Client 4 (GraphQL)**, and **SCSS**.

This app is the public-facing website. It shows products, a blog, a shopping cart, and a wishlist, and it hands the actual payment step off to WordPress / WooCommerce by redirecting the shopper there to complete checkout. Content — both products and blog articles — lives in WordPress and is read over GraphQL.

> **Status:** the app builds and runs. Linting and type-checking pass. A GitHub Actions CI pipeline runs lint, typecheck, tests, and build on every push and pull request, and a Vitest suite (20 tests) covers the cart context. Test coverage is not measured yet — see [Roadmap](#roadmap). This README describes what exists today, not what's intended.

---

## Table of contents

- [What this app does](#what-this-app-does)
- [Architecture: why two repositories](#architecture-why-two-repositories)
- [How the pieces fit together](#how-the-pieces-fit-together)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Key concepts (for newcomers)](#key-concepts-for-newcomers)
- [Available scripts](#available-scripts)
- [Contributing](#contributing)
- [Continuous integration](#continuous-integration)
- [AI-assisted development](#ai-assisted-development)
- [Roadmap](#roadmap)
- [Changelog](#changelog)

---

## What this app does

| Feature | Description |
|---|---|
| **Shop** | Lists products fetched from WooCommerce via GraphQL |
| **Product detail** | Full product page with image gallery, size selection, add-to-cart |
| **Cart** | Client-side cart, stored in the browser (`localStorage`) |
| **Wishlist** | Save-for-later list, also stored in `localStorage` |
| **Checkout** | Redirects to WordPress / WooCommerce to complete the purchase |
| **Blog** | Articles fetched from WordPress via GraphQL |
| **Search** | Searches products or blog posts |
| **SEO** | Structured data (Schema.org), meta tags, 301 redirects |
| **Newsletter** | Email signup modal connected to Mailchimp |
| **Contact form** | Sends email via the **Resend** API |
| **Analytics** | Google Analytics 4 with Consent Mode v2 |

A note on the split: this repo is **only the storefront**. It doesn't store products, process payments, or hold the database. Those live in a separate WordPress / WooCommerce backend. This app reads from that backend and, when it's time to pay, sends the shopper over to it. That's what "headless" means here — the front end and the content/commerce backend are two separate systems talking over an API.

---

## Architecture: why two repositories

Shamanicca is split across **two repositories on purpose**, not by accident:

- **This repo** (`web-app-graphql`) — the React/Next.js storefront. Renders the shop, product pages, blog, cart, and wishlist, and reads all content from WordPress/WooCommerce through WPGraphQL.
- **[shamanicca-ecommerce-wp-theme-checkout](https://github.com/maubayuelo/shamanicca-ecommerce-wp-theme-checkout)** — a WooCommerce child theme (storefront-child) responsible for the checkout flow only: cart-to-order handoff, payment, and order confirmation.

**Why not one repo?** The storefront is a stateless, statically-generated Next.js app deployed on Vercel — it only *reads* data. Checkout is a stateful WooCommerce flow (payment, order state, sessions) that has to run inside WordPress to use WooCommerce's built-in cart, payment gateways, and order management. Splitting them keeps each deployable and scaled independently, and keeps PCI/payment-sensitive code out of the public frontend repo. Merging them into a monorepo would not remove that boundary — it would just hide it.

**Current state:** checkout redirects the user from this app to the WooCommerce theme to complete purchase (see `src/lib/api/woocommerce.ts`). **Migrating checkout into this React app is on the roadmap** — the WooCommerce theme repo will remain the backend for order processing, but the UI will eventually be rendered here instead of being a redirect.

---

## How the pieces fit together

```
                    ┌─────────────────────────┐
                    │  WordPress / WooCommerce │
                    │  (products, blog, orders)│
                    └───────────┬─────────────┘
                                │  GraphQL (read)
                                ▼
   Shopper ──▶  ┌──────────────────────────────┐
                │   THIS APP (Next.js storefront)│
                │  • browse shop & blog          │
                │  • cart + wishlist (localStorage)
                │  • search, SEO, analytics      │
                └───────────┬──────────────────┘
                            │  redirect at checkout
                            ▼
                    WordPress / WooCommerce
                    (shopper completes payment)
```

The data only flows **one way for content**: WordPress is the source of truth, this app reads it. The cart and wishlist are the exception — they live entirely in the shopper's browser (`localStorage`) until checkout, at which point the shopper is handed to WooCommerce to pay.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (Pages Router) |
| Language | TypeScript 5 |
| UI library | React 18 |
| Data / API | GraphQL via Apollo Client 4 |
| UI components | Mantine 8 |
| Styling | SCSS *(migration to Tailwind planned — see [Roadmap](#roadmap))* |
| Email | Resend |
| Newsletter | Mailchimp |
| Analytics | Google Analytics 4 (Consent Mode v2) |
| Backend (external) | WordPress + WooCommerce |

---

## Getting started

**Prerequisites:** Node.js (a current LTS) and npm. You'll also need access to a WordPress/WooCommerce backend exposing GraphQL, and the API keys listed under [Environment variables](#environment-variables).

```bash
# 1. Clone
git clone https://github.com/maubayuelo/shamanicca-ecommerce-graphQL.git
cd web-app-graphql

# 2. Install dependencies
npm install

# 3. Create your local env file (see the next section)
cp .env.example .env.local
# then edit .env.local with your real values

# 4. Run the dev server
npm run dev
```

The dev server starts at `http://localhost:3000`.

> **Heads-up on `.env.example`:** it is currently out of date for email — it lists SendGrid/SMTP variables, but the app actually uses **Resend**. Use the [Environment variables](#environment-variables) table below as the source of truth until `.env.example` is corrected. This is a known issue on the [Roadmap](#roadmap).

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in your values. `.env.local` is git-ignored and must never be committed.

The table below reflects what the **code actually reads**. Where it disagrees with `.env.example`, trust the table.

| Variable | Required | What it's for |
|---|---|---|
| `NEXT_PUBLIC_GRAPHQL_URL` | Yes | GraphQL endpoint the app queries |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | Yes | GraphQL endpoint (secondary/config use) |
| `NEXT_PUBLIC_SITE_URL` | Yes | This app's own public URL (canonicals, SEO) |
| `NEXT_PUBLIC_WC_STORE_URL` | Yes | WooCommerce store base URL |
| `NEXT_PUBLIC_WP_CHECKOUT_URL` | Yes | Where shoppers are redirected to pay |
| `WORDPRESS_API_URL` | Yes | WordPress API base (server-side) |
| `RESEND_API_KEY` | Yes (contact form) | Resend API key — powers the contact form |
| `RESEND_FROM` | Yes (contact form) | "From" address for contact-form email |
| `CONTACT_EMAIL` | Yes (contact form) | "To" address that receives contact-form email |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_GA_ENABLED` | Optional | Toggle GA on/off |
| `SENTRY_DSN` | Optional | Error reporting (Sentry), if used |
| `NODE_ENV` / `PORT` | Optional | Standard Node runtime settings |

> **Not used by the code:** `SENDGRID_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`. These appear in the current `.env.example` but the app reads none of them — the contact form is Resend-based. They'll be removed when `.env.example` is fixed.

---

## Project structure

```
src/
├── components/          # UI, organized atomic-design style
│   ├── atoms/           #   smallest pieces (buttons, inputs…)
│   ├── molecules/       #   small groups of atoms
│   └── organisms/       #   larger sections (Header, galleries…)
├── lib/
│   ├── context/
│   │   └── cart.tsx     # the cart — React Context (see note below)
│   ├── graphql/
│   │   ├── queries.ts   # GraphQL queries
│   │   └── types.ts     # TypeScript shapes for query responses
│   └── api/
│       └── woocommerce.ts  # WooCommerce REST helper (used on the home page)
├── pages/               # Next.js Pages Router — each file is a route
│   ├── api/             #   server-side API routes (e.g. contact form)
│   ├── shop/
│   ├── blog/
│   └── products/
├── styles/              # SCSS
└── utils/

scripts/                 # setup.sh (run via `npm run setup`)
```

> **Cart — one implementation, not two.** The cart is a single React Context in `src/lib/context/cart.tsx`, consumed via a `useCart()` hook and provided at the app root. (Earlier versions of this project experimented with a Zustand store; that was removed. If you see Zustand referenced anywhere, it's stale — Context is the one and only cart.)

---

## Key concepts (for newcomers)

New to this stack? Here's the short version of the ideas that matter most in this codebase.

**Headless WordPress.** WordPress normally renders its own pages. Here it doesn't — it only serves *data* (products, posts) through an API. This Next.js app is the "head" that reads that data and renders the actual website. The two are decoupled, so the front end can be rebuilt without touching the backend.

**GraphQL + Apollo Client.** REST gives you fixed endpoints that return fixed blobs of data. GraphQL lets the app ask for *exactly* the fields it needs in one request. Apollo Client is the library that sends those queries and caches the results. One thing to know if you touch queries: in Apollo Client 4, `client.query()` returns `unknown` unless you give it a type — `client.query<MyResponseType>(...)`. The response shapes live in `src/lib/graphql/types.ts`; add to that file rather than reaching for `any`.

**Atomic design.** Components are grouped by size and reusability: *atoms* (a button), *molecules* (a labelled input), *organisms* (a whole header). Build from small to large; keep the small ones dumb and reusable.

**Client-side cart.** The cart and wishlist aren't on a server — they're in the browser's `localStorage`. This keeps the storefront simple and fast, and means the app doesn't need its own database. The trade-off: the cart is per-device, and it's cleared server-side only at checkout, when WooCommerce takes over.

**Consent-gated analytics.** Google Analytics runs under Consent Mode v2 — tracking respects the shopper's consent choice rather than firing unconditionally.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server (`localhost:3000`) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (via `next lint`) |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run test` | Run the Vitest suite (20 tests, cart context) once and exit |
| `npm run setup` | Run `scripts/setup.sh` |

> `npm run test` runs Vitest with `--run` (no watch mode), covering the cart context's behavior, persistence, and hydration. Coverage is not measured yet — see [Roadmap](#roadmap).

---

## Contributing

Current, honest state of the checks:

- `npm run lint` — **passes** (exit 0). It reports ~100 pre-existing warnings (mostly `@typescript-eslint/no-explicit-any`) and **0 errors**. The warnings are a known cleanup backlog, not a blocker.
- `npm run typecheck` — **passes clean** (0 errors).
- `npm run build` — **passes** (generates all static pages).
- `npm run test` — **passes** (20 tests; see above).

Before opening a PR, run `npm run lint`, `npm run typecheck`, and `npm run test`, and make sure you haven't *added* new errors. Please don't introduce new `any` types — if you're typing a GraphQL response, add the shape to `src/lib/graphql/types.ts`.

See [Continuous integration](#continuous-integration) for what the automated pipeline checks.

---

## Continuous integration

CI (GitHub Actions) runs on every push and pull request: `lint`, `typecheck`, and the Vitest suite. Lint warnings are **not** gated — the workflow only fails on lint errors, so the ~100 existing warnings won't block a PR. That's deliberate until the [lint cleanup](#roadmap) lands.

The production build is intentionally **not** part of CI. `next build` fetches the live headless-WordPress GraphQL API at build time to pre-render pages, and that endpoint sits behind host-level bot protection that serves automated CI runners a challenge page instead of data. Running the build in CI would end up testing API reachability from a datacenter IP, not our code — so CI verifies the code, and Vercel's deployment build (which runs from an environment the host doesn't challenge) is the correct place to verify the build itself.

The follow-up is to make build-time data fetching degrade gracefully so the build is resilient regardless of where it runs — see the [Roadmap](#roadmap).

---

## AI-assisted development

This repo carries a curated, version-pinned set of **14 agent skills** (in `.agents/skills/`, e.g. `deploy-to-vercel`, `vercel-react-best-practices`, `web-design-guidelines`) with their sources and content hashes locked in `skills-lock.json`, so AI-assisted work stays reproducible. `.claude/skills/` holds symlinks into the same set for Claude Code's discovery path — same skills, one source of truth. These are curated third-party skills, pinned like any other dependency.

---

## Roadmap

Known gaps and planned work, so nothing here is a surprise:

- **Tailwind migration** — refactor the SCSS layer to Tailwind with a design-token system. This is a prerequisite for planned checkout work.
- **Fix `.env.example`** — declare the Resend variables (`RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_EMAIL`) and remove the unused SendGrid/SMTP keys.
- **Lint cleanup** — work through the ~100 existing warnings (largely `no-explicit-any`).
- **Remove dead code** — `src/lib/api/stripe.ts` is no longer imported anywhere and can be deleted.
- **Measure test coverage** — `@vitest/coverage-v8` isn't installed yet; add it and wire up `npm run test:coverage`.
- **Gate lint on warnings** — once the cleanup pass above lands, tighten CI to `next lint --max-warnings 0`.
- **Upgrade Vitest** — move from 1.6 to the current major (4) once there's time to handle any breaking config changes.
- **Make build-time data fetching resilient** — graceful fallback when the GraphQL API is unreachable or returns non-JSON, so `next build` can't be broken by an upstream challenge page — would allow re-adding build to CI.

---

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md). Latest entry: **`0.1.0` (2025-12-18)** — initial public storefront scaffolding.