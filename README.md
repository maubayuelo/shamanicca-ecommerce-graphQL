# Shamanicca E‑commerce (web-app)

Next.js + TypeScript storefront for Shamanicca. This app renders the public shop, product listing, and product detail experiences, with GraphQL data, SCSS styling, and modern testing/linting.

## Tech stack

- Next.js 15
- React 19
- TypeScript 5
- Styling: Sass/SCSS + PostCSS/Autoprefixer
- Data: GraphQL (Apollo Client + graphql-request)
- Testing: Vitest + Testing Library + jsdom
- Linting: ESLint 9 + eslint-config-next
- Deployment: Vercel (recommended)

## Prerequisites

- Node.js 18.18+ (or 20+) and a package manager (npm, pnpm, or yarn)
- A running GraphQL endpoint for products/content
- Stripe keys if you plan to test checkout locally

## Quick start

```bash
# 1) Install deps
npm install

# 2) Copy env template and fill values
cp .env.example .env.local

# 3) Start dev server
npm run dev
# App runs on http://localhost:3000 by default
```

## Environment variables

Create a `.env.local` (gitignored) using `.env.example` as a reference.

Public (exposed in the browser, prefixed with NEXT_PUBLIC_):
- `NEXT_PUBLIC_GRAPHQL_URL` – GraphQL API endpoint for read operations
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – Stripe publishable key for client-side
- `NEXT_PUBLIC_SITE_URL` – Base site URL (e.g., http://localhost:3000)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` – Google Analytics GA4 ID
- `NEXT_PUBLIC_GA_ENABLED` – Enable/disable GA collection (`true`/`false`)

Server-side only (never exposed to client):
- `STRIPE_SECRET_KEY` – Stripe secret key for server actions/webhooks

SMTP (optional, for emails):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

Optional third-parties:
- `SENDGRID_API_KEY`, `SENTRY_DSN`

Local/dev:
- `NODE_ENV`, `PORT` (usually not required to set)

Tip: Never commit real secrets. Production values should be set in your hosting provider (e.g., Vercel → Project Settings → Environment Variables).

## Scripts

From `package.json`:

- `npm run dev` – Start the Next.js dev server
- `npm run build` – Create a production build
- `npm run start` – Start the production server (after build)
- `npm run lint` – Lint the codebase
- `npm run typecheck` – Type-check without emitting files
- `npm run test` – Run unit tests with Vitest
- `npm run setup` – Project setup script (`scripts/setup.sh`)

## Project structure

```
src/
  components/        # UI components (atoms, molecules, organisms, sections)
  lib/               # API/GraphQL and utility helpers
  pages/             # Next.js pages (App/Document, routes)
  styles/            # Global styles, variables, mixins
  utils/             # Constants, navigation, mocks, etc.
public/              # Static assets
scripts/             # Setup and maintenance scripts
.next/               # Build output (gitignored)
```

Notable files:
- `.env.example` – Template for environment variables
- `.eslintrc.json` – ESLint configuration
- `next.config.js` – Next.js configuration
- `tsconfig.json` – TypeScript configuration

## Development

- Type safety: `npm run typecheck`
- Linting: `npm run lint` (integrates with Next ESLint rules)
- Testing: `npm run test` (Vitest + Testing Library)

Recommended VS Code extensions:
- ESLint, Prettier (optional), GraphQL syntax highlighting

## Deployment (Vercel)

1) Push to GitHub (e.g., `shamanicca-ecommerce` repo)
2) Import the repository in Vercel
3) Add environment variables in Vercel → Project Settings → Environment Variables
4) Trigger a build; Next.js will output serverless/edge-ready artifacts

For other platforms, run `npm run build` and serve with `npm run start`.

## Contributing

- Create feature branches from `main`
- Keep PRs focused and small; include screenshots for UI changes
- Ensure `lint`, `typecheck`, and `test` pass before requesting review

## License

TBD – choose a license or keep private. If open source, MIT is a common choice.
