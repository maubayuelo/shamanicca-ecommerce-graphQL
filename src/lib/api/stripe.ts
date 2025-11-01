// NOTE: This is a client helper placeholder. Create server-side API routes that use STRIPE_SECRET_KEY.
// Example usage: POST /api/checkout -> create Checkout Session with stripe and return sessionId.

export async function createCheckoutSession(items: any[]) {
  // Implement server-side. This client helper can call your /api/checkout endpoint.
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.json();
}
