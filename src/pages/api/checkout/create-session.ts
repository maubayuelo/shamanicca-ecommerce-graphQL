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

function buildHeaders(cartToken?: string | null, nonce?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (HTTP_AUTH_USER && HTTP_AUTH_PASS) {
    const encoded = Buffer.from(`${HTTP_AUTH_USER}:${HTTP_AUTH_PASS}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }

  if (cartToken) {
    headers['Cart-Token'] = cartToken;
  }

  // WooCommerce Store API requires a Nonce header on all cart-modifying requests
  if (nonce) {
    headers['Nonce'] = nonce;
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
  let nonce: string | null = null;

  // Step 1: Initialize cart session to get Cart-Token + Nonce.
  // GET /cart creates a fresh session and returns both headers,
  // which are required for all subsequent cart-modifying requests.
  try {
    const initRes = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    cartToken = initRes.headers.get('Cart-Token');
    nonce = initRes.headers.get('Nonce');
  } catch (err) {
    console.error('[checkout/create-session] cart init error:', err);
  }

  // Step 2: Add each item to the cart session using the token + nonce.
  for (const item of items) {
    if (!item.product_id || item.quantity < 1) continue;

    try {
      const response = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart/add-item`, {
        method: 'POST',
        headers: buildHeaders(cartToken, nonce),
        body: JSON.stringify({
          id: item.product_id,
          quantity: item.quantity,
          ...(item.variation_id ? { variation_id: item.variation_id } : {}),
        }),
      });

      // Refresh cart token from response if the server rotates it
      const updatedToken = response.headers.get('Cart-Token');
      if (updatedToken) cartToken = updatedToken;

      if (!response.ok) {
        const body = await response.text();
        console.error(`[checkout/create-session] add-item failed for product ${item.product_id}:`, body);
      }
    } catch (err) {
      console.error(`[checkout/create-session] fetch error for product ${item.product_id}:`, err);
    }
  }

  // Extract the session key from the Cart-Token JWT payload.
  // WooCommerce's classic session handler expects the raw customer ID
  // (e.g. "t_abc123") via ?woocommerce-session=, not the full JWT.
  let sessionKey: string | null = null;
  if (cartToken) {
    try {
      const payload = JSON.parse(
        Buffer.from(cartToken.split('.')[1], 'base64').toString('utf8'),
      );
      sessionKey = payload.user_id ?? null;
    } catch {
      // fall back to full token below
    }
  }

  const sessionParam = sessionKey ?? cartToken;
  const checkoutUrl = sessionParam
    ? `${WC_BASE}/checkout/?woocommerce-session=${encodeURIComponent(sessionParam)}`
    : `${WC_BASE}/checkout/`;

  return res.status(200).json({ url: checkoutUrl });
}
