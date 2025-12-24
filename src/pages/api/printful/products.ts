import type { NextApiRequest, NextApiResponse } from 'next';
import { listProducts } from '../../../lib/api/printful';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    if (!process.env.PRINTFUL_API_KEY) {
      return res.status(200).json({ products: [] });
    }
    const products = await listProducts();
    res.status(200).json({ products });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
