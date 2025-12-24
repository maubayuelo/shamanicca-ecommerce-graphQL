import type { NextApiRequest, NextApiResponse } from 'next';

// Stripe no longer used; stub endpoint to avoid build-time dependency.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Return a null URL to indicate checkout is disabled/handled elsewhere.
  return res.status(200).json({ url: null });
}
