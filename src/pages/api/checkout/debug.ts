import type { NextApiRequest, NextApiResponse } from 'next';

const WC_BASE = (
  process.env.NEXT_PUBLIC_WC_STORE_URL || 'https://master.shamanicca.com'
).replace(/\/$/, '');

/**
 * Temporary diagnostic endpoint — maps the full redirect chain.
 * GET /api/checkout/debug
 * REMOVE THIS FILE before going to production.
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const results: Record<string, unknown> = {
    wc_base: WC_BASE,
    timestamp: new Date().toISOString(),
  };

  let cartToken: string | null = null;
  let nonce: string | null = null;
  let sessionKey: string | null = null;

  // 1. Init cart session — get Cart-Token + Nonce
  try {
    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart`, {
      headers: { 'Content-Type': 'application/json' },
    });
    cartToken = r.headers.get('Cart-Token');
    nonce = r.headers.get('Nonce');
    results.cart_init_status = r.status;
    results.cart_token = cartToken ? 'present' : 'missing';
    results.nonce = nonce ? 'present' : 'missing';

    // Extract session key from JWT payload (user_id field)
    if (cartToken) {
      try {
        const payload = JSON.parse(
          Buffer.from(cartToken.split('.')[1], 'base64').toString('utf8'),
        );
        sessionKey = payload.user_id ?? null;
        results.session_key = sessionKey;
      } catch {
        results.session_key = 'decode_failed';
      }
    }
  } catch (err: unknown) {
    results.cart_init_error = err instanceof Error ? err.message : String(err);
  }

  // 2. Try adding a product using the nonce (ID 1 = probe; 400 "not found" is expected, 401 = broken)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cartToken) headers['Cart-Token'] = cartToken;
    if (nonce) headers['Nonce'] = nonce;
    const r = await fetch(`${WC_BASE}/wp-json/wc/store/v1/cart/add-item`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 1, quantity: 1 }),
    });
    results.add_item_probe_status = r.status; // 400 "not found" = good, 401 = broken nonce
  } catch (err: unknown) {
    results.add_item_probe_error = err instanceof Error ? err.message : String(err);
  }

  // 3. Checkout with NO session (should redirect to cart URL — reveals woocommerce_get_cart_url value)
  try {
    const r = await fetch(`${WC_BASE}/checkout/`, { redirect: 'manual' });
    results.checkout_empty_status = r.status;
    results.checkout_empty_location = r.headers.get('location');
  } catch (err: unknown) {
    results.checkout_empty_error = err instanceof Error ? err.message : String(err);
  }

  // 4. Checkout with session key via ?woocommerce-session=<key>
  if (sessionKey) {
    try {
      const url = `${WC_BASE}/checkout/?woocommerce-session=${encodeURIComponent(sessionKey)}`;
      const r = await fetch(url, { redirect: 'manual' });
      results.checkout_with_session_key_status = r.status;
      results.checkout_with_session_key_location = r.headers.get('location');
    } catch (err: unknown) {
      results.checkout_with_session_key_error = err instanceof Error ? err.message : String(err);
    }
  }

  // 5. Checkout with full JWT via ?woocommerce-cart-token=<JWT>
  if (cartToken) {
    try {
      const url = `${WC_BASE}/checkout/?woocommerce-cart-token=${encodeURIComponent(cartToken)}`;
      const r = await fetch(url, { redirect: 'manual' });
      results.checkout_with_cart_token_status = r.status;
      results.checkout_with_cart_token_location = r.headers.get('location');
    } catch (err: unknown) {
      results.checkout_with_cart_token_error = err instanceof Error ? err.message : String(err);
    }
  }

  // 6. WordPress home page — does it redirect anywhere?
  try {
    const r = await fetch(`${WC_BASE}/`, { redirect: 'manual' });
    results.home_status = r.status;
    results.home_location = r.headers.get('location');
  } catch (err: unknown) {
    results.home_error = err instanceof Error ? err.message : String(err);
  }

  // 7. shamanicca.com/cart — where does it go?
  try {
    const r = await fetch('https://shamanicca.com/cart', { redirect: 'manual' });
    results.shamanicca_cart_status = r.status;
    results.shamanicca_cart_location = r.headers.get('location');
  } catch (err: unknown) {
    results.shamanicca_cart_error = err instanceof Error ? err.message : String(err);
  }

  return res.status(200).json(results);
}
