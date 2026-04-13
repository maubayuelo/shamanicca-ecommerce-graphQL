import type { NextApiRequest, NextApiResponse } from 'next';

const WC_BASE = (
  process.env.NEXT_PUBLIC_WC_STORE_URL || 'https://master.shamanicca.com'
).replace(/\/$/, '');

// Optional: set these in Vercel env vars if master.shamanicca.com is behind
// HTTP Basic Auth (common on SiteGround staging environments).
const HTTP_AUTH_USER = process.env.WP_HTTP_AUTH_USER;
const HTTP_AUTH_PASS = process.env.WP_HTTP_AUTH_PASS;

type CartItem = {
  product_id: number;
  quantity: number;
  variation_id?: number;
};

type HandlerResponse = { url: string } | { error: string };

function buildHeaders(cartToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Embed HTTP Basic Auth for password-protected staging sites
  if (HTTP_AUTH_USER && HTTP_AUTH_PASS) {
    const encoded = Buffer.from(`${HTTP_AUTH_USER}:${HTTP_AUTH_PASS}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }

  // Maintain the same WC cart session across multiple add-item calls
  if (cartToken) {
    headers['Cart-Token'] = cartToken;
  }

  return headers;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HandlerResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const items: CartItem[] = Array.isArray(req.body?.items) ? req.body.items : [];

  if (items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  let cartToken: string | null = null;

  for (const item of items) {
    if (!item.product_id || item.quantity < 1) continue;

    try {
      const response = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart/add-item`, {
        method: 'POST',
        headers: buildHeaders(cartToken),
        body: JSON.stringify({
          id: item.product_id,
          quantity: item.quantity,
          ...(item.variation_id ? { variation_id: item.variation_id } : {}),
        }),
      });

      // WooCommerce Store API returns the Cart-Token on the first response;
      // subsequent requests reuse it via the request header.
      if (!cartToken) {
        cartToken = response.headers.get('Cart-Token');
      }

      if (!response.ok) {
        const body = await response.text();
        console.error(`[checkout/create-session] add-item failed for product ${item.product_id}:`, body);
      }
    } catch (err) {
      console.error(`[checkout/create-session] fetch error for product ${item.product_id}:`, err);
      // Continue — still try remaining items
    }
  }

  // ?woocommerce-session=<token> is the official WooCommerce headless cart-restore
  // parameter (WooCommerce 6.2+ / Blocks). Falls back to plain checkout if we
  // couldn't obtain a token.
  const checkoutUrl = cartToken
    ? `${WC_BASE}/checkout/?woocommerce-session=${encodeURIComponent(cartToken)}`
    : `${WC_BASE}/checkout/`;

  return res.status(200).json({ url: checkoutUrl });
}
