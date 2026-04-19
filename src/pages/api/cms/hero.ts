import type { NextApiRequest, NextApiResponse } from 'next';

// WORDPRESS_API_URL already includes /wp-json (e.g. https://master.shamanicca.com/wp-json)
const WP_REST = (
  process.env.WORDPRESS_API_URL ||
  `${(process.env.NEXT_PUBLIC_WP_BASE_URL || 'https://master.shamanicca.com').replace(/\/$/, '')}/wp-json`
).replace(/\/$/, '');

const HOME_SLUG = process.env.WP_HOME_SLUG || 'home';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = `${WP_REST}/wp/v2/pages?slug=${HOME_SLUG}&_fields=acf`;

  try {
    const wpRes = await fetch(url);

    if (!wpRes.ok) {
      return res.status(200).json({ hero: null, _debug: { url, status: wpRes.status } });
    }

    const pages = await wpRes.json();

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(200).json({ hero: null, _debug: { url, reason: 'no pages returned' } });
    }

    const hero = pages[0]?.acf?.hero ?? null;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ hero, _debug: { url, acf_keys: Object.keys(pages[0]?.acf ?? {}) } });
  } catch (err) {
    return res.status(200).json({
      hero: null,
      _debug: { url, error: err instanceof Error ? err.message : String(err) },
    });
  }
}
