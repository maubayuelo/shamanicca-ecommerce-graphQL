import type { NextApiRequest, NextApiResponse } from 'next';

const WC_BASE = (
  process.env.NEXT_PUBLIC_WC_STORE_URL || 'https://master.shamanicca.com'
).replace(/\/$/, '');

/**
 * Temporary diagnostic endpoint.
 * GET /api/checkout/debug
 * Tests whether the WooCommerce Store API is reachable, whether a nonce
 * can be obtained, and whether cart items can be added with that nonce.
 *
 * REMOVE THIS FILE before going to production.
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const results: Record<string, unknown> = {
    wc_base: WC_BASE,
    timestamp: new Date().toISOString(),
  };

  let cartToken: string | null = null;
  let nonce: string | null = null;

  // 1. GET /cart to initialize session and retrieve Cart-Token + Nonce
  try {
    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart`, {
      headers: { 'Content-Type': 'application/json' },
    });
    results.cart_init_status = r.status;
    results.cart_init_ok = r.ok;
    cartToken = r.headers.get('Cart-Token');
    nonce = r.headers.get('Nonce');
    results.cart_token_from_init = cartToken ? 'present' : 'missing';
    results.nonce_from_init = nonce ? 'present' : 'missing';
  } catch (err: unknown) {
    results.cart_init_error = err instanceof Error ? err.message : String(err);
  }

  // 2. Try adding a known product using the nonce (product_id 1 will likely 404 but confirms nonce flow)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cartToken) headers['Cart-Token'] = cartToken;
    if (nonce) headers['Nonce'] = nonce;

    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart/add-item`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 1, quantity: 1 }),
    });
    results.add_item_status = r.status;
    const text = await r.text();
    try { results.add_item_body = JSON.parse(text); } catch { results.add_item_body = text.slice(0, 300); }
  } catch (err: unknown) {
    results.add_item_error = err instanceof Error ? err.message : String(err);
  }

  // 3. Test a plain fetch of /checkout/ to see what status/redirect it returns
  try {
    const r = await fetch(`${WC_BASE}/checkout/`, { redirect: 'manual' });
    results.checkout_status = r.status;
    results.checkout_location = r.headers.get('location');
  } catch (err: unknown) {
    results.checkout_fetch_error = err instanceof Error ? err.message : String(err);
  }

  return res.status(200).json(results);
}
