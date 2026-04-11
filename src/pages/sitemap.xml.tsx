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
