/**
 * next.config.js — Next.js configuration
 *
 * This file configures the Next.js framework itself (not the app logic).
 *
 * KEY SETTINGS:
 *
 * reactStrictMode: true
 *   — Enables React's strict mode in development. This deliberately double-renders
 *     components to help catch bugs like side effects in render functions.
 *     Only active in development, not in production.
 *
 * eslint/typescript ignoreDuringBuilds
 *   — Skip lint/type errors during `npm run build`. This lets the app deploy
 *     even if there are non-blocking type warnings. In production you want
 *     CI/CD to catch these separately before they reach build.
 *
 * images.remotePatterns
 *   — Next.js's <Image> component only optimizes (resize/compress/convert to WebP)
 *     images from explicitly allowed hostnames. This prevents the server from
 *     being used as a proxy for arbitrary external images.
 *
 * redirects()
 *   — 301 (permanent) redirects tell browsers AND search engines that a URL
 *     has moved. This preserves SEO authority when URLs change.
 *     - /post/:slug → /blog/:slug  (WordPress default URLs → new blog URLs)
 *     - /?p=123 → /blog           (WordPress numeric IDs → blog root)
 *     - /store/:cat → /shop/:cat  (old shop URLs → new shop URLs)
 */

module.exports = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'your-cdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'wp-siteground-domain.com', pathname: '/**' },
      { protocol: 'https', hostname: 'master.shamanicca.com', pathname: '/**' },
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'cms.shamanicca.com', pathname: '/**' },
    ],
    // Keep SVGs disabled for safety; we now request PNGs
    dangerouslyAllowSVG: false,
  },
  env: {
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  async rewrites() {
    return [
      // Serve the static shamanicca-biolink SPA build (public/bioIG/index.html)
      // at /bioIG — Next.js's public folder doesn't auto-resolve directory
      // requests to index.html, so this maps the bare path explicitly.
      { source: '/bioIG', destination: '/bioIG/index.html' },
    ];
  },
  async redirects() {
    return [
      // Old WordPress /post/:slug → new /blog/:slug (preserves SEO authority)
      {
        source: '/post/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      // Old WordPress /?p=:id catch-all → blog root (fallback for numeric IDs)
      {
        source: '/',
        has: [{ type: 'query', key: 'p' }],
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/store/:category',
        destination: '/shop/:category',
        permanent: true,
      },
      // Placeholder (lorem ipsum) slugs left over from the theme demo, renamed in
      // WordPress during the SEO/AEO cleanup. Deploy together with the WP slug change.
      {
        source: '/blog/risus-pretium-quam-vulputate-dignissim',
        destination: '/blog/runes-numerology-sacred-geometry-guide',
        permanent: true,
      },
      {
        source: '/blog/autem-voluptates-atque-repellat',
        destination: '/blog/beginners-guide-to-wiccan-tools',
        permanent: true,
      },
      {
        source: '/blog/accusantium-nulla-impedit-quae-voluptatibus',
        destination: '/blog/how-to-craft-spells-ritual-magic',
        permanent: true,
      },
      // Slugs that described a different article than the one they serve.
      {
        source: '/blog/these-unseen-beings-can-give-fame-talent-wealth-power',
        destination: '/blog/tarot-for-beginners-how-to-read-the-cards',
        permanent: true,
      },
      {
        source: '/blog/the-most-powerful-entity-on-earth',
        destination: '/blog/animal-totems-and-spirit-animals',
        permanent: true,
      },
    ];
  },
};
