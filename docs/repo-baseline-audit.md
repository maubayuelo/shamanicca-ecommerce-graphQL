# Repo Baseline Audit — pre-refactor fact check

Read-only inspection pass ahead of refactor work. No files were created, edited, deleted, installed, or committed while producing this report except this document itself. Facts and file paths only — no recommendations, no proposed changes.

Branch at time of audit: `chore/harness-baseline`. Working tree clean.

---

## 1. Agent instructions

**Inventory of instruction files:**
- `AGENTS.md` (root, 139 lines) — the only root-level agent-instruction file.
- `CLAUDE.md` — none found anywhere in the repo (root or nested).
- `.claude/` — contains `settings.local.json` (3 permission entries: `git add:*`, `git commit -m ':*`, `git push:*`) and `.claude/skills/` (15 entries, all symlinks — see below).
- `.agents/` — contains `.agents/skills/` (15 skill directories with real content: `SKILL.md`, and for four of them a nested `AGENTS.md`: `vercel-react-native-skills/AGENTS.md`, `vercel-react-view-transitions/AGENTS.md`, `vercel-react-best-practices/AGENTS.md`, `vercel-composition-patterns/AGENTS.md`). These nested `AGENTS.md` files belong to third-party skill packages, not the project.
- `skills-lock.json` (root, 75 lines) — a lockfile pinning skill versions/sources.
- `docs/readme-facts-check.md` — a prior read-only audit doc (not an agent-instruction file, but relevant background: it documents `.env.example` drift and the Resend vs. SendGrid mismatch, matching section 5 below).

**`AGENTS.md` (root) — section-by-section:**
1. Header/pointers (lines 1–9): points to `README.md` for humans, `docs/MIGRATION-TAILWIND.md` for the Tailwind migration.
2. Project (11–19): one-paragraph description, production URL, GraphQL endpoint.
3. Stack (22–37): table of framework/runtime/language/data/styling/components/tests/deploy with versions; explicit "Pages Router, not App Router" rule.
4. Commands (40–52): dev/build/typecheck/lint/test commands; states `npm run typecheck && npm run build` must pass before declaring a task complete.
5. Directory map (55–76): ASCII tree of `src/`, with an atomic-design placement rule.
6. Conventions (79–92): exports, prop typing, no `any`, DOMPurify requirement, SSR/localStorage hydration guard, Consent Mode v2, env var rule.
7. Hard rules (95–108): 7 numbered "do not without explicit instruction" items (API stability, don't touch `queries.ts`, don't rename/move files during styling tasks, don't add deps, don't read `package-lock.json`, don't edit `.env.local`/print secrets, don't commit unless asked).
8. Known debt (111–120): `@types/react` v19/react v18 mismatch, `lib/api/stripe.ts` marked legacy, Mantine-only-for-carousel note tied to the Tailwind migration.
9. Working style (124–132): one-phase-at-a-time, show diffs, ask one question when ambiguous, minimal-change bias, comment sparingly.
10. Current focus (136–139): states the SCSS→Tailwind migration is active and to read `docs/MIGRATION-TAILWIND.md` before touching `src/styles/` or any `className`.

**What `AGENTS.md` does NOT cover:**
- `docs/MIGRATION-TAILWIND.md`, referenced twice (lines 7, 138), does not exist. `find docs -type f` returns only `docs/readme-facts-check.md`. Unknown whether this was deleted, never created, or misnamed.
- No mention of CI/`.github/workflows/ci.yml` behavior (lint/typecheck/test only, no build).
- No mention of `postcss.config.js` or the presence of `@tailwind` directives in `src/styles/globals.css`.
- No mention of the `resend`/Mailchimp env vars actually read by the code, or of `.env.example` drift.
- No mention of `skills-lock.json` or the `.claude`/`.agents` skill-symlink structure.
- No git/branch/commit-message conventions.

**Are `.claude/skills` entries real symlinks into `.agents/skills`?** Verified. `ls -la .claude/skills` shows all 15 entries as `lrwxr-xr-x` symlinks, each resolving to `../../.agents/skills/<name>`, and each target directory exists under `.agents/skills/` with real file content.

---

## 2. Scripts & gates

**`package.json` scripts block (verbatim):**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "setup": "bash scripts/setup.sh"
}
```

**`.github/workflows/ci.yml`** (the only workflow file; full contents):
- Name: `CI`
- Triggers: `push` to `main`, `pull_request` targeting `main`, `workflow_dispatch` (lines 3–8).
- `permissions: contents: read` (line 11); concurrency group cancels in-progress runs on the same ref (13–15).
- Single job `verify` on `ubuntu-latest`, steps in order:
  1. `actions/checkout@v7`
  2. `actions/setup-node@v7`, Node version from `node-version-file: '.nvmrc'` (`.nvmrc` contains `24.15.0`), npm cache enabled
  3. `npm ci`
  4. `npm run lint` (comment notes lint does not gate on warnings yet, ~100 pre-existing)
  5. `npm run typecheck`
  6. `npm run test`
- No `build` step. A trailing comment block (lines 44–48) explains build is intentionally excluded because `next build` hits the live WPGraphQL API and gets blocked by SiteGround bot protection in CI.

**Does CI run `build`?** No — confirmed from `.github/workflows/ci.yml` alone; there is no step invoking `npm run build` or `next build`.

---

## 3. Styling architecture

**`src/styles/` file tree with line counts:**
```
src/styles/
├── variables.scss (67)
├── helpers.scss (365)
├── forms.scss (201)
├── mixins.scss (100)
├── typography.scss (268)
├── scss.d.ts (2)
├── globals.scss (98)
├── globals.css (10)
├── animations.scss (15)
├── components/
│   ├── store-subheader.scss (91)
│   ├── blog.scss (337)
│   ├── cookie-consent.scss (105)
│   ├── newsletter-modal.scss (120)
│   ├── go-top.scss (46)
│   ├── hero.scss (99)
│   ├── home-articles.scss (93)
│   ├── product-listing.scss (113)
│   ├── wp-content.scss (91)
│   ├── product-sticky-bar.scss (100)
│   ├── form-field.scss (92)
│   ├── button.scss (137)
│   ├── card.scss (3)
│   ├── home-banners.scss (81)
│   ├── article-share-icons.scss (83)
│   ├── product-img-gallery.scss (202)
│   ├── contact-form.scss (66)
│   ├── breadcrumb.scss (31)
│   ├── paginator.scss (145)
│   ├── email-collector.scss (54)
│   ├── announcement-banner.scss (32)
│   ├── product-sort.scss (25)
│   ├── navigation.scss (87)
│   ├── header.scss (405)
│   ├── product-filter.scss (119)
│   └── footer.scss (84)
└── pages/
    ├── contact.scss (0 — empty file)
    ├── about.scss (60)
    ├── product.scss (220)
    ├── home.scss (3)
    ├── Shamanicca.code-workspace (10 — not a stylesheet; a VS Code workspace file)
    ├── wishlist.scss (123)
    └── cart.scss (118)
```

**Where styles are imported — global vs. modules vs. component-level:**
- Everything is global. `grep -rE "\.scss['\"]"` across `src/**/*.{ts,tsx}` returns exactly two hits: `src/styles/scss.d.ts:1` (`declare module '*.scss';`, a TS ambient declaration, not an import) and `src/pages/_app.tsx` (six literal `.scss` imports: `globals.scss`, `components/header.scss`, `pages/product.scss`, `pages/about.scss`, `pages/cart.scss`, `pages/wishlist.scss`).
- No CSS Modules (`*.module.scss`/`.css`) exist in `src/styles/` or elsewhere in `src`.
- No component file imports SCSS directly.
- `src/styles/globals.scss` itself `@use`s 27 partials (lines 1–28: variables, mixins, typography, helpers, forms, and 22 `components/*` files) — these are pulled in transitively through the single `_app.tsx` import of `globals.scss`, not imported individually by components.
- Component-scoped selectors are applied by class name matching (BEM-ish), not by JS-level per-component imports — i.e., the SCSS architecture is "one global stylesheet graph," not colocated component styles.

**Count: components importing SCSS directly:** 0 components. 1 non-component file (`_app.tsx`) does the imports; `scss.d.ts` is a type declaration, not a component.

**Orphaned/unreferenced SCSS files** (no `@use` in `globals.scss` and no import in `_app.tsx`, checked by path-string match against every `.ts`/`.tsx` file in `src`):
- `src/styles/components/card.scss` (3 lines)
- `src/styles/components/email-collector.scss` (54 lines)
- `src/styles/components/navigation.scss` (87 lines)
- `src/styles/pages/contact.scss` (0 lines, empty)
- `src/styles/pages/home.scss` (3 lines)

**Duplicate-path note:** `header.scss` is pulled in twice — once via `globals.scss`'s `@use "./components/header"` (line 5) and again as a direct import in `_app.tsx` (`import '../styles/components/header.scss'`, line 24). Same file, two inclusion paths.

**Mantine 8 role:** `@mantine/core`, `@mantine/hooks`, `@mantine/carousel` are declared as dependencies in `package.json` (`^8.3.6` each), and `AGENTS.md` (line 31, and "Known debt" line 118) states Mantine is used only for the product-page carousel. However, `grep -rn "mantine" src` (case-insensitive) returns **zero matches** anywhere in `src/`. No Mantine import, no `MantineProvider`, no theme file was found. Unknown whether Mantine has already been removed from actual usage while the dependency/doc references lag, or whether the carousel component that uses it lives outside `src/` (not found) — cannot determine further without inferring.
- No Mantine theme definition exists in the codebase (none found).
- No Mantine CSS import (`@mantine/core/styles.css` or similar) was found anywhere in `src`.

**`postcss.config.js` (full contents):**
```js
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
```
Only plugin present is `autoprefixer`. No `tailwindcss` plugin entry. No comments explaining the choice exist in the file itself.

---

## 4. Tailwind traces

- **`package.json` dependencies/devDependencies:** no `tailwindcss` entry (checked both `dependencies` and `devDependencies` — absent from both).
- **`tailwind.config.*`:** none found anywhere in the repo root or nested (`find . -iname "tailwind.config*"` excluding `node_modules` returns nothing).
- **`@tailwind`/`@apply` directives:** found in exactly one file — `src/styles/globals.css` (10 lines total): `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`, plus a comment `/* App components layer (empty; using SCSS system in globals.scss) */`. This file is **not imported anywhere** in `src` (confirmed by `grep -rln "globals\.css" src` returning no results) — it exists on disk but is not wired into the app.
- **PostCSS plugin entries for Tailwind:** none in `postcss.config.js` (only `autoprefixer`, per section 3).
- **Tailwind-shaped class names in components:** none of the grep patterns tested (`flex `, `p-[0-9]`, `text-(sm|lg|xl)`, `bg-[a-z]+-[0-9]`, etc.) matched any `className=` usage in `src/**/*.tsx`.

**Conclusion:** Tailwind is not wired into the build (no dependency, no config, no PostCSS plugin). The only trace is the unused `@tailwind` directive block in `src/styles/globals.css`, which appears to be a stub left over from migration prep and is currently dead code (unimported).

---

## 5. Doc vs. code drift

**README build/CI contradiction:**
- README.md line 9: "A GitHub Actions CI pipeline runs lint, typecheck, tests, **and build** on every push and pull request."
- README.md line 241: "The production build is intentionally **not** part of CI."
- `.github/workflows/ci.yml` has no build step (section 2 above) — this matches line 241, not line 9. Line 9 is the inaccurate claim.

**`.env.example` vs. actual `process.env` reads:**
`.env.example` declares: `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_GRAPHQL_ENDPOINT`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WC_STORE_URL`, `NEXT_PUBLIC_WP_CHECKOUT_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GA_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `WORDPRESS_API_URL`, `SENDGRID_API_KEY`, `SENTRY_DSN`, `NODE_ENV`, `PORT`.

Actual `process.env.*` reads found via `grep -rohE "process\.env\.[A-Z_0-9]+" src scripts next.config.js`:
`CONTACT_EMAIL`, `GRAPHQL_ENDPOINT`, `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER`, `NEXT_PUBLIC_GA_ENABLED`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GRAPHQL_ENDPOINT`, `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WC_STORE_URL`, `NEXT_PUBLIC_WP_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM`, `STRIPE_SECRET_KEY`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, `WC_STORE_URL`, `WORDPRESS_API_URL`, `WP_HOME_SLUG`, `WP_HTTP_AUTH_PASS`, `WP_HTTP_AUTH_USER`, `WP_SITE_SETTINGS_SLUG`.

Mismatches:
- Code reads but `.env.example` does **not** declare: `CONTACT_EMAIL`, `GRAPHQL_ENDPOINT`, `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER`, `NEXT_PUBLIC_WP_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM`, `STRIPE_SECRET_KEY`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, `WC_STORE_URL`, `WP_HOME_SLUG`, `WP_HTTP_AUTH_PASS`, `WP_HTTP_AUTH_USER`, `WP_SITE_SETTINGS_SLUG`.
- `.env.example` declares but code does **not** read: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SENDGRID_API_KEY`, `SENTRY_DSN`, `NEXT_PUBLIC_WP_CHECKOUT_URL`, `PORT`.
- This corroborates `docs/readme-facts-check.md`, which independently flagged the Resend-vs-SendGrid/SMTP mismatch.

**`src/lib/api/stripe.ts` existence/usage:**
- File exists at `src/lib/api/stripe.ts`.
- `grep -rn "lib/api/stripe" src` and a broader `from.*stripe` search across `src/**/*.{ts,tsx}` return **zero import references**. The file is present but unimported anywhere in `src`. This matches `AGENTS.md`'s "Known debt" note (line 117: "`lib/api/stripe.ts` is legacy").

**Other doc/code contradictions found:**
- `AGENTS.md` references `docs/MIGRATION-TAILWIND.md` twice as required reading before touching styles — file does not exist (section 1).
- `AGENTS.md` (Stack table, line 31, and Known debt, line 118) describes Mantine as actively used for the product carousel; no Mantine usage exists anywhere in `src` (section 3).
- `src/styles/globals.css` contains active `@tailwind` directives suggesting a migration in progress, but it is not imported by the app and Tailwind is not an installed dependency (section 4) — the file misrepresents the actual migration state.

---

## 6. Git state

- Current branch: `chore/harness-baseline`.
- Working tree: clean (`git status --porcelain` returns no output).
- Last 10 commits (one line each):
```
4553618 chore: remove unused Figma scratch files, tidy header.scss whitespace
f082176 ci: scope CI to lint/typecheck/test; document build exclusion
940212b ci: run lint, typecheck, tests, and build on push and pull request
bbc1bad test: cover cart context behavior, persistence, and hydration
e25337b test: wire up Vitest with jsdom and smoke test
92f8248 docs: rewrite README to reflect verified project state
0466adc fix: type GraphQL response shapes to satisfy typecheck
342170c fix: correct invalid no-img-element eslint override
f7e2d96 docs(readme): document two-repo architecture for hireability
3bd88d6 chore: remove dead Zustand cart store, add AGENTS.md
```
