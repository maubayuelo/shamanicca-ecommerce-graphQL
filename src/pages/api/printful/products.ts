import type { NextApiRequest, NextApiResponse } from 'next';

// Printful no longer used; stub endpoint for compatibility.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  return res.status(200).json({ products: [] });
}
