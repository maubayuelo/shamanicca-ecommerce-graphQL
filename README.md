# Shamanicca — E-commerce Web App

A modern e-commerce storefront for **Shamanicca**, built with **Next.js**, **TypeScript**, **GraphQL**, and **SCSS**.

This app is the public-facing website: it shows products, a blog, a shopping cart, a wishlist, and handles the checkout flow by redirecting users to WordPress/WooCommerce.

---

## Table of Contents

1. [What this app does](#what-this-app-does)
2. [Tech stack (and why)](#tech-stack-and-why)
3. [How data flows through the app](#how-data-flows-through-the-app)
4. [Project structure explained](#project-structure-explained)
5. [Key concepts for the interview](#key-concepts-for-the-interview)
6. [Environment variables](#environment-variables)
7. [Scripts](#scripts)
8. [Getting started locally](#getting-started-locally)
9. [Deployment (Vercel)](#deployment-vercel)

---

## What this app does

| Feature | Description |
|---|---|
| **Shop** | Lists products fetched from WooCommerce via GraphQL |
| **Product detail** | Full product page with gallery, size selection, add-to-cart |
| **Cart** | Client-side cart stored in the browser (`localStorage`) |
| **Wishlist** | Save-for-later list, also stored in `localStorage` |
| **Checkout** | Redirects to WordPress/WooCommerce to complete purchase |
| **Blog** | Articles fetched from WordPress via GraphQL |
| **Search** | Searches products or blog posts |
| **SEO** | Structured data (Schema.org), meta tags, 301 redirects |
| **Newsletter** | Email signup modal connected to Mailchimp |
| **Contact form** | Sends emails via Resend API |
| **Analytics** | Google Analytics 4 with Consent Mode v2 |

---

## Tech stack (and why)

### Core Framework — Next.js 15

**Next.js** is a framework built on top of React. It adds:

- **File-based routing** — every file inside `src/pages/` becomes a URL automatically
- **Server-side rendering (SSR)** — pages can be generated on the server before sending HTML to the browser
- **Static Site Generation (ISG/ISR)** — pages can be pre-built at deploy time, then refreshed periodically
- **API Routes** — serverless functions inside `src/pages/api/` (like mini Express endpoints)

> Why not plain React? Plain React only renders in the browser. Next.js pre-renders pages on the server so users get fast HTML immediately (better SEO and performance).

---

### Language — TypeScript 5

TypeScript is JavaScript with **types**. Types let you define the shape of data so your editor warns you before you make mistakes.

```ts
// Without TypeScript (JavaScript)
function greet(user) { return user.name; } // What is "user"? Who knows.

// With TypeScript
type User = { name: string; age: number };
function greet(user: User) { return user.name; } // Crystal clear!
```

---

### Data Fetching — GraphQL + Apollo Client

**GraphQL** is a query language for APIs. Instead of hitting many REST endpoints, you write a single query describing exactly what data you need.

```graphql
# REST approach: 3 separate requests
GET /products
GET /products/1/images
GET /products/1/categories

# GraphQL approach: 1 request asking for exactly what you need
query {
  product(id: "1") {
    name
    price
    image { sourceUrl }
    productCategories { nodes { name } }
  }
}
```

**Apollo Client** is the library that manages GraphQL queries in React. It handles:
- Sending queries to the server
- Caching the results so you don't re-fetch the same data
- Exposing the data via the `useQuery` hook in your components

This app connects to **WPGraphQL** — a WordPress plugin that exposes all WordPress/WooCommerce data as a GraphQL API.

---

### State Management — React Context + Zustand

**State** = data that can change and that components need to share.

**React Context API** is React's built-in solution for sharing state between many components without "prop drilling" (passing props down many levels).

```
App (has the cart data)
  └── Header (needs cart count)
        └── CartBadge (needs cart count)
              └── Number (needs cart count)
```
Without Context you'd pass `cartCount` as a prop at every level. With Context, any component can read it directly.

**Zustand** is a simpler, lighter alternative to Redux for state management. This app uses it for the cart store, with `persist` middleware to automatically save/restore cart data from `localStorage`.

---

### Styling — SCSS + Mantine UI

**SCSS** (Sass) is CSS with superpowers: variables, nesting, mixins (reusable style blocks), and more.

```scss
// Plain CSS
.header { background: #fff; }
.header .nav { display: flex; }

// SCSS — cleaner nesting + variables
$white: #fff;
.header {
  background: $white;
  .nav { display: flex; }
}
```

**Mantine UI** is a React component library used for complex UI pieces like the image carousel on the product page.

---

## How data flows through the app

Here is the big picture of how data travels from WordPress to the user's screen:

```
WordPress CMS (hosted on SiteGround)
        │
        │  WPGraphQL plugin exposes GraphQL API
        ▼
https://master.shamanicca.com/graphql
        │
        │  Apollo Client sends queries (from Next.js build or browser)
        ▼
Next.js (hosted on Vercel)
        │
        ├── getStaticProps (runs at BUILD TIME on the server)
        │     └── Fetches products + blog posts + banners
        │           → passes them as props to the page component
        │
        ├── useQuery (runs in the BROWSER after page loads)
        │     └── Re-fetches fresh data client-side
        │           → updates the page without a full reload
        │
        └── Page component renders HTML → User sees the page
```

### Cart and Wishlist data flow (client-side only)

```
User clicks "Add to Cart"
        │
        ▼
CartProvider (React Context)
        │
        ▼
localStorage (browser storage — persists when page refreshes)
        │
        ▼
useCart() hook — any component can read/update cart
        │
        ▼
Header shows badge count, Cart page shows items
```

---

## Project structure explained

```
shamanicca-web-app/
│
├── public/                  ← Static files served directly (images, favicons)
│   └── images/              ← SVG icons and the site logo
│
├── src/
│   │
│   ├── pages/               ← Every file here = a URL route
│   │   ├── _app.tsx         ← Root wrapper (providers, global styles, analytics)
│   │   ├── _document.tsx    ← Custom HTML shell (meta tags, favicons)
│   │   ├── index.tsx        ← Homepage (/)
│   │   ├── shop/
│   │   │   ├── index.tsx    ← Shop landing (/shop)
│   │   │   └── [category].tsx ← Dynamic: /shop/women, /shop/men, etc.
│   │   ├── products/
│   │   │   └── [slug].tsx   ← Dynamic: /products/my-product-name
│   │   ├── blog/
│   │   │   ├── index.tsx    ← Blog listing (/blog)
│   │   │   └── [slug].tsx   ← Dynamic: /blog/my-post-title
│   │   ├── cart.tsx         ← Cart page (/cart)
│   │   ├── wishlist.tsx     ← Wishlist page (/wishlist)
│   │   ├── search.tsx       ← Search results (/search)
│   │   └── api/             ← Serverless API routes (like Express endpoints)
│   │       ├── contact.ts   ← POST /api/contact → sends email via Resend
│   │       ├── newsletter.ts← POST /api/newsletter → Mailchimp signup
│   │       ├── shop/
│   │       │   ├── categories.ts  ← GET /api/shop/categories
│   │       │   └── products.ts    ← GET /api/shop/products
│   │       └── blog/
│   │           └── categories.ts  ← GET /api/blog/categories
│   │
│   ├── components/          ← Reusable UI pieces (Atomic Design pattern)
│   │   ├── atoms/           ← Smallest pieces: Button, GoTop, CookieConsent
│   │   ├── molecules/       ← Medium pieces: ProductCard, NewsletterModal
│   │   ├── organisms/       ← Large pieces: Header, Footer
│   │   └── sections/        ← Full page sections: Hero, ProductsGrid, BlogGrid
│   │
│   ├── lib/                 ← Core logic and integrations
│   │   ├── graphql/
│   │   │   ├── apolloClient.ts  ← Sets up the Apollo Client instance
│   │   │   ├── queries.ts       ← All GraphQL query definitions
│   │   │   └── utils.ts         ← Helper: picks the best image size from WP
│   │   ├── context/
│   │   │   ├── cart.tsx         ← Cart state (React Context)
│   │   │   ├── wishlist.tsx     ← Wishlist state (React Context)
│   │   │   └── cookieConsent.tsx← Cookie consent state
│   │   ├── store/
│   │   │   └── cart.ts          ← Cart state (Zustand version — alternative)
│   │   └── api/
│   │       ├── woocommerce.ts   ← WooCommerce REST API fallback client
│   │       ├── stripe.ts        ← Stripe checkout (legacy)
│   │       └── wp.ts            ← WordPress utility functions
│   │
│   ├── styles/              ← SCSS stylesheets
│   │   ├── globals.scss     ← Reset, body, utility classes
│   │   ├── variables.scss   ← Colors, spacing, breakpoints as SCSS variables
│   │   ├── mixins.scss      ← Reusable SCSS blocks (e.g., responsive media queries)
│   │   ├── typography.scss  ← Font sizes, weights, text utilities
│   │   ├── components/      ← Per-component SCSS (header.scss, button.scss, etc.)
│   │   └── pages/           ← Per-page SCSS (home.scss, product.scss, etc.)
│   │
│   ├── types/               ← TypeScript type/interface definitions
│   │   └── global.d.ts      ← Ambient declarations (e.g., SCSS modules)
│   │
│   └── utils/               ← Pure helper functions
│       ├── constants.ts     ← App-wide constants
│       ├── html.ts          ← cleanExcerpt(), decodeEntities() for WP content
│       ├── navigation.ts    ← Nav link definitions
│       ├── dom.ts           ← Browser DOM helpers (useBodyClass hook)
│       └── mockProducts.ts  ← Fallback data for development
│
├── scripts/                 ← Shell scripts for setup tasks
├── .env.example             ← Template for environment variables
├── next.config.js           ← Next.js configuration
├── tsconfig.json            ← TypeScript configuration
└── package.json             ← Dependencies and scripts
```

---

## Key concepts for the interview

### 1. Atomic Design Pattern

Components in this project follow **Atomic Design** — a system that organizes UI into layers from simplest to most complex:

| Level | What it is | Example here |
|---|---|---|
| **Atom** | Single-purpose, no dependencies | `Button.tsx`, `GoTop.tsx` |
| **Molecule** | 2–3 atoms combined | `ProductCard.tsx`, `Breadcrumb.tsx` |
| **Organism** | Complex, self-contained section | `Header.tsx`, `Footer.tsx` |
| **Section** | Full page content area | `Hero.tsx`, `ProductsGrid.tsx`, `BlogGrid.tsx` |

---

### 2. Static Site Generation with ISR (Incremental Static Regeneration)

The homepage uses `getStaticProps` with `revalidate`:

```ts
export const getStaticProps: GetStaticProps = async () => {
  // This runs on the SERVER at build time (and every 5 minutes after)
  const products = await fetchProducts();
  return {
    props: { products },
    revalidate: 300, // Re-generate this page every 300 seconds (5 min)
  };
};
```

**What this means:**
- At build time, Next.js pre-renders the homepage HTML with fresh data
- The static HTML is served instantly to every user (super fast)
- After 5 minutes, the next visitor triggers a background refresh
- No user ever waits — they always get the cached version while Next.js updates it silently

---

### 3. Dynamic Routes

Pages with square brackets `[slug].tsx` are **dynamic routes**. Next.js uses `getStaticPaths` to pre-generate them:

```ts
// src/pages/products/[slug].tsx
export async function getStaticPaths() {
  const slugs = await getAllProductSlugs(); // ["t-shirt", "hoodie", ...]
  return {
    paths: slugs.map((s) => ({ params: { slug: s } })),
    fallback: 'blocking', // Generate unknown slugs on-demand
  };
}
```

---

### 4. React Context API pattern

Every Context in this app follows the same 3-part pattern:

```ts
// 1. CREATE the context
const CartContext = React.createContext<CartContextValue | undefined>(undefined);

// 2. CREATE the Provider (wraps children, manages state)
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  // ... state logic ...
  return <CartContext.Provider value={{ items, addItem, removeItem }}>
    {children}
  </CartContext.Provider>;
}

// 3. CREATE a custom hook (safe way to consume the context)
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
```

Usage anywhere in the app:
```ts
function Header() {
  const { items } = useCart(); // No prop drilling!
  return <span>{items.length} items</span>;
}
```

---

### 5. API Routes (Serverless Functions)

Files in `src/pages/api/` are **serverless API endpoints** — they run on the server, not the browser. This is how the contact form works without exposing API keys:

```ts
// src/pages/api/contact.ts
// This runs on the SERVER — the user never sees the Resend API key
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, email, message } = req.body;
  await resend.emails.send({ to: 'hello@shamanicca.com', ... });
  res.status(200).json({ ok: true });
}
```

---

### 6. localStorage for persistence

The cart and wishlist survive page reloads because they are saved to the browser's `localStorage`:

```ts
// Save
localStorage.setItem('shamanicca-cart', JSON.stringify(items));

// Restore on page load
const saved = localStorage.getItem('shamanicca-cart');
const items = saved ? JSON.parse(saved) : [];
```

**Important:** `localStorage` only exists in the browser, not on the server. This is why there is a `hydrated` flag — components wait until the browser has loaded the data before showing cart counts, to avoid "flash" mismatches between server HTML and client state.

---

### 7. SEO — Structured Data (Schema.org / JSON-LD)

Search engines like Google can read structured data to better understand pages. This app adds JSON-LD scripts to pages:

```ts
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  offers: { '@type': 'Offer', price: product.price },
};
// Rendered as: <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
```

---

### 8. Google Analytics Consent Mode v2

The app loads GA4 but **blocks data collection by default** until the user accepts cookies:

```ts
// FIRST: set defaults to denied (before GA script loads)
gtag('consent', 'default', { analytics_storage: 'denied' });

// THEN: load GA script (it respects the denied state)
<Script src="https://www.googletagmanager.com/gtag/js?id=..." />

// LATER: when user accepts cookies
gtag('consent', 'update', { analytics_storage: 'granted' });
```

This makes the app compliant with GDPR (European privacy law).

---

## Environment variables

Create a `.env.local` file (never commit this to git):

```bash
cp .env.example .env.local
```

| Variable | Where it's used | Public? |
|---|---|---|
| `NEXT_PUBLIC_GRAPHQL_URL` | Apollo Client endpoint | Yes (browser) |
| `NEXT_PUBLIC_SITE_URL` | SEO meta tags, schema.org | Yes (browser) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics | Yes (browser) |
| `NEXT_PUBLIC_GA_ENABLED` | Toggle analytics on/off | Yes (browser) |
| `WORDPRESS_API_URL` | Server-side WP REST calls | No (server only) |
| `RESEND_API_KEY` | Contact form emails | No (server only) |
| `SMTP_HOST/PORT/USER/PASSWORD` | Alternative email | No (server only) |

> **Rule of thumb:** Any variable starting with `NEXT_PUBLIC_` is sent to the browser and visible to users. Never put secrets (API keys, passwords) in `NEXT_PUBLIC_` variables.

---

## Scripts

```bash
npm run dev       # Start development server at http://localhost:3000
npm run build     # Build for production
npm run start     # Run the production build locally
npm run lint      # Check code style with ESLint
npm run typecheck # Check TypeScript types (no output files)
npm run test      # Run unit tests with Vitest
npm run setup     # Initial project setup script
```

---

## Getting started locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd web-app-graphql

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# 4. Start the dev server
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

This app is deployed on **Vercel** — the company that created Next.js, so they work perfectly together.

```bash
# 1. Push code to GitHub
git push origin main

# 2. In Vercel dashboard:
#    - Import the GitHub repository
#    - Set all environment variables (from .env.local)
#    - Vercel auto-detects Next.js and builds it

# 3. Every push to main triggers an automatic re-deploy
```

**How Vercel works with Next.js:**
- Static pages (with `getStaticProps`) → deployed as pre-built HTML files on a CDN
- Dynamic pages and API routes → deployed as serverless functions
- ISR pages → static HTML that auto-refreshes after the `revalidate` seconds

---

## Contributing

- Branch from `main` for all features
- Run `npm run lint && npm run typecheck && npm run test` before opening a PR
- Include screenshots for any UI changes

---

## License

Private — all rights reserved.
