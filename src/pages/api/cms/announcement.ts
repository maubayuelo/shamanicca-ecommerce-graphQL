import type { NextApiRequest, NextApiResponse } from 'next';

const WP_REST = (
  process.env.WORDPRESS_API_URL ||
  `${(process.env.NEXT_PUBLIC_WP_BASE_URL || 'https://master.shamanicca.com').replace(/\/$/, '')}/wp-json`
).replace(/\/$/, '');

const SITE_SETTINGS_SLUG = process.env.WP_SITE_SETTINGS_SLUG || 'site-settings';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const url = `${WP_REST}/wp/v2/pages?slug=${SITE_SETTINGS_SLUG}&_fields=acf`;

  try {
    const wpRes = await fetch(url);

    if (!wpRes.ok) {
      return res.status(200).json({ banner: null, _debug: { url, status: wpRes.status } });
    }

    const pages = await wpRes.json();

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(200).json({ banner: null, _debug: { url, reason: 'no pages returned' } });
    }

    const banner = pages[0]?.acf?.top_novelties_banner ?? null;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ banner, _debug: { url, acf_keys: Object.keys(pages[0]?.acf ?? {}) } });
  } catch (err) {
    return res.status(200).json({
      banner: null,
      _debug: { url, error: err instanceof Error ? err.message : String(err) },
    });
  }
}
