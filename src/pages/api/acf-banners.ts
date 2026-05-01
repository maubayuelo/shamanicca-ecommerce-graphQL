import type { NextApiRequest, NextApiResponse } from 'next';

const WP_BASE = (process.env.NEXT_PUBLIC_WP_BASE_URL || 'https://master.shamanicca.com').replace(/\/$/, '');
// Slug of the WP Page that holds the global banner fields (the "Site Settings" page)
const SITE_SETTINGS_SLUG = process.env.SITE_SETTINGS_PAGE_SLUG || 'site-settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { type, id } = req.query;

  let wpUrl: string;
  let isPageLookup = false;

  if (type === 'category' && id) {
    wpUrl = `${WP_BASE}/wp-json/acf/v3/categories/${id}`;
  } else if (type === 'options') {
    // Field group is on a regular WP Page ("Site Settings"), not an ACF Options Page.
    // Look it up by slug via the standard WP REST API.
    wpUrl = `${WP_BASE}/wp-json/wp/v2/pages?slug=${SITE_SETTINGS_SLUG}&_fields=acf`;
    isPageLookup = true;
  } else {
    return res.status(400).json({ error: 'Invalid params' });
  }

  try {
    const wpRes = await fetch(wpUrl, {
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
    });
    if (!wpRes.ok) return res.status(wpRes.status).json({ error: `WP ${wpRes.status}` });
    const data = await wpRes.json();

    // Pages endpoint returns an array — extract the first match
    const payload = isPageLookup ? (Array.isArray(data) && data[0] ? data[0] : {}) : data;

    // Enrich banner_image with medium/large sizes via WP media API
    const acf = payload?.acf;
    if (acf && typeof acf.banner_image === 'string' && acf.banner_image) {
      try {
        const mediaRes = await fetch(
          `${WP_BASE}/wp-json/wp/v2/media?source_url=${encodeURIComponent(acf.banner_image)}&_fields=media_details`,
          { headers: { Accept: 'application/json' } },
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          const sizes = Array.isArray(mediaData) && mediaData[0]?.media_details?.sizes;
          if (sizes) {
            acf.banner_image_medium = sizes.medium?.source_url ?? null;
            acf.banner_image_large = sizes.large?.source_url ?? sizes.medium_large?.source_url ?? null;
          }
        }
      } catch { /* sizes stay absent — components fall back to banner_image */ }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[acf-banners] fetch error:', err);
    return res.status(502).json({ error: 'Failed to reach WordPress' });
  }
}
