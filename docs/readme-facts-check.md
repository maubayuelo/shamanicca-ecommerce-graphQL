# README Facts Check — pre-rewrite

Read-only fact-gathering pass ahead of the README rewrite. Build was green at the time of this check (lint completes, typecheck clean, build passes). No files were edited, created, installed, or committed while producing this report — this file is documentation only.

---

## 1. Email provider — the truth

`src/pages/api/contact.ts` imports `Resend` from the `resend` package and calls `resend.emails.send(...)`. It reads `process.env.RESEND_API_KEY` (guards with a graceful no-op if unset), plus `RESEND_FROM` and `CONTACT_EMAIL` for the from/to addresses.

- **package.json installed:** only `resend` (`^6.12.2`). Neither `@sendgrid/mail`, `sendgrid`, nor `nodemailer` are dependencies.
- **`.env.example` email-related keys:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SENDGRID_API_KEY`. It does **not** declare `RESEND_API_KEY`, `RESEND_FROM`, or `CONTACT_EMAIL`.

**Verdict:** the code uses **Resend** and reads **`RESEND_API_KEY`** (plus `RESEND_FROM`/`CONTACT_EMAIL`). `.env.example` declares **SendGrid + SMTP** variables instead — none of which the code reads at all.

**`.env.example` is the one that's wrong.** It documents an email setup (SendGrid/SMTP) that doesn't exist in the code, and omits the three variables (`RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_EMAIL`) that actually control the contact form. The README's env table should describe Resend as the real provider; `.env.example` needs a follow-up fix (not done here — out of scope for this pass).

---

## 2. Contributing commands — confirmed current state

```
npm run lint       → exit 0, completes, 100 warnings, 0 errors
npm run typecheck  → exit 0, clean, 0 errors
```

Both genuinely pass. Warning count is exactly **100** (counted by matching `line:col  Warning:` entries in the lint output) — safe to describe honestly in the README as "completes with ~100 pre-existing lint warnings (mostly `@typescript-eslint/no-explicit-any`), 0 errors."

---

## 3. Skills scaffolding

- `skills-lock.json` pins **14 skills**. Example names: `deploy-to-vercel`, `vercel-react-best-practices`, `web-design-guidelines`, `industrial-brutalist-ui`.
- Confirmed: `.claude/skills/` entries are **symlinks** pointing into `.agents/skills/` (e.g. `deploy-to-vercel -> ../../.agents/skills/deploy-to-vercel`). `.agents/skills/` holds the actual pinned skill content; `.claude/skills/` just mirrors it for Claude Code's discovery path — same skills, two access points, not two separate sets.

---

## 4. Changelog + versions

- Latest changelog entry: **`[0.1.0] - 2025-12-18`** — "Initial public storefront scaffolding." (The `[Unreleased]` section above it is empty.)
- Confirmed unchanged from the earlier audit: `next` `^15.5.0` (major 15), `react` `^18.3.1` (major 18), `typescript` `^5.0.0` (major 5), `@apollo/client` `^4.0.0` (major 4).

---

## 5. Project description (from the current README, verbatim)

Opening pitch:

> A modern e-commerce storefront for **Shamanicca**, built with **Next.js**, **TypeScript**, **GraphQL**, and **SCSS**.
>
> This app is the public-facing website: it shows products, a blog, a shopping cart, a wishlist, and handles the checkout flow by redirecting users to WordPress/WooCommerce.

Features table (current "What this app does" section):

| Feature | Description |
|---|---|
| Shop | Lists products fetched from WooCommerce via GraphQL |
| Product detail | Full product page with gallery, size selection, add-to-cart |
| Cart | Client-side cart stored in the browser (`localStorage`) |
| Wishlist | Save-for-later list, also stored in `localStorage` |
| Checkout | Redirects to WordPress/WooCommerce to complete purchase |
| Blog | Articles fetched from WordPress via GraphQL |
| Search | Searches products or blog posts |
| SEO | Structured data (Schema.org), meta tags, 301 redirects |
| Newsletter | Email signup modal connected to Mailchimp |
| Contact form | Sends emails via Resend API |
| Analytics | Google Analytics 4 with Consent Mode v2 |

Repo directory basename confirmed: **`web-app-graphql`** — the `cd web-app-graphql` instruction in Getting Started is correct as-is.

---

## Open items to resolve in the rewrite

- Fix `.env.example` to declare `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_EMAIL` and drop/flag the unused `SENDGRID_API_KEY`, `SMTP_*` keys (tracked separately — not done in this pass).
- README's Contributing section can now honestly say lint/typecheck/build all pass, with the caveat that lint carries ~100 pre-existing warnings (not blocking).
- A short "curated agent skills" mention (2-3 lines, framed as curation not authorship) can reference the 14 pinned skills and the `.agents/skills` → `.claude/skills` symlink relationship.
