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
    ];
  },
};
