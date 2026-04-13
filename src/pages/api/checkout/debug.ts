import type { NextApiRequest, NextApiResponse } from 'next';

const WC_BASE = (
  process.env.NEXT_PUBLIC_WC_STORE_URL || 'https://master.shamanicca.com'
).replace(/\/$/, '');

/**
 * Temporary diagnostic endpoint.
 * GET /api/checkout/debug
 * Tests whether the WooCommerce Store API is reachable from the Vercel server
 * and whether a cart session can be created.
 *
 * REMOVE THIS FILE before going to production.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: Record<string, unknown> = {
    wc_base: WC_BASE,
    timestamp: new Date().toISOString(),
  };

  // 1. Test plain GET on the Store API root
  try {
    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    results.store_api_status = r.status;
    results.store_api_ok = r.ok;
    // Suppress full route listing — just confirm it's reachable
    results.store_api_body = '(suppressed)';
  } catch (err: any) {
    results.store_api_error = err?.message ?? String(err);
  }

  // 2. Try adding a known product (use product_id 1 as a probe — will likely 404 but confirms routing)
  try {
    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, quantity: 1 }),
    });
    results.add_item_status = r.status;
    results.cart_token = r.headers.get('Cart-Token');
    const text = await r.text();
    try { results.add_item_body = JSON.parse(text); } catch { results.add_item_body = text.slice(0, 300); }
  } catch (err: any) {
    results.add_item_error = err?.message ?? String(err);
  }

  // 3. Test a plain fetch of /checkout/ to see what status/redirect it returns
  try {
    const r = await fetch(`${WC_BASE}/checkout/`, { redirect: 'manual' });
    results.checkout_status = r.status;
    results.checkout_location = r.headers.get('location');
  } catch (err: any) {
    results.checkout_fetch_error = err?.message ?? String(err);
  }

  return res.status(200).json(results);
}
