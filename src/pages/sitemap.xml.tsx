/**
 * sitemap.xml.tsx — Dynamic XML sitemap (route: /sitemap.xml)
 *
 * Generates a machine-readable sitemap for search engine crawlers (Google, Bing, etc.).
 * A sitemap tells search engines what URLs exist on the site, how often they change,
 * and their relative importance.
 *
 * HOW THIS WORKS IN NEXT.JS:
 * The filename `sitemap.xml.tsx` creates the route /sitemap.xml.
 * The default export is a dummy component (returns null — nothing to render).
 * All the real work happens in `getServerSideProps` which:
 *  1. Builds the XML string
 *  2. Writes it directly to the HTTP response with res.write()
 *  3. Returns empty props (the component is never actually rendered)
 *
 * WHY getServerSideProps AND NOT getStaticProps?
 * Because we want the sitemap to always reflect the current state of the CMS.
 * A static sitemap would go stale every time a product or post is added/removed.
 * Cache-Control headers make this efficient:
 *   s-maxage=3600 → CDN caches it for 1 hour
 *   stale-while-revalidate=7200 → serves stale for 2 more hours while regenerating
 *
 * WHAT'S INCLUDED:
 *  - STATIC_ROUTES: hardcoded pages with manual changefreq and priority settings
 *  - Product slugs: fetched from WooCommerce via GET_PRODUCT_SLUGS query (up to 500)
 *  - Blog post slugs: fetched from WordPress via GET_POST_SLUGS query (up to 500)
 *
 * PRIORITY VALUES:
 *  1.0 → Homepage (most important)
 *  0.9 → Shop
 *  0.8 → Blog, product pages
 *  0.7 → Blog posts
 *  0.5 → About
 *  0.3 → Cart (least important)
 *
 * ERROR HANDLING:
 * Each GraphQL call is wrapped in its own try/catch. If WooCommerce is down,
 * the sitemap still returns with at least the static routes.
 */

import type { GetServerSideProps } from 'next';
import client from '../lib/graphql/apolloClient';
import { GET_PRODUCT_SLUGS, GET_POST_SLUGS } from '../lib/graphql/queries';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/cart', changefreq: 'never', priority: '0.3' },
];

function buildUrl(path: string, changefreq: string, priority: string) {
  return `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`.trim();
}

function buildSitemap(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('\n  ')}
</urlset>`;
}

// This component is never rendered — the page only returns XML via getServerSideProps
export default function SitemapPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urls: string[] = STATIC_ROUTES.map(({ path, changefreq, priority }) =>
    buildUrl(path, changefreq, priority),
  );

  // Product slugs
  try {
    const { data } = await client.query({ query: GET_PRODUCT_SLUGS, variables: { first: 500 } });
    const slugs: string[] = ((data as any).products?.nodes || [])
      .map((p: any) => p.slug)
      .filter(Boolean);
    slugs.forEach((slug) => {
      urls.push(buildUrl(`/products/${slug}`, 'weekly', '0.8'));
    });
  } catch {
    // skip if GraphQL is unavailable during build
  }

  // Blog post slugs
  try {
    const { data } = await client.query({ query: GET_POST_SLUGS, variables: { first: 500 } });
    const slugs: string[] = ((data as any).posts?.nodes || [])
      .map((p: any) => p.slug)
      .filter(Boolean);
    slugs.forEach((slug) => {
      urls.push(buildUrl(`/blog/${slug}`, 'monthly', '0.7'));
    });
  } catch {
    // skip if GraphQL is unavailable during build
  }

  const sitemap = buildSitemap(urls);

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  res.write(sitemap);
  res.end();

  return { props: {} };
};
