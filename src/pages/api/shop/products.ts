import type { NextApiRequest, NextApiResponse } from 'next';
import client from '../../../lib/graphql/apolloClient';
import { GET_PRODUCTS_BY_CATEGORY } from '../../../lib/graphql/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { category } = req.query;
  
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Category parameter is required' });
  }

  try {
    const { data } = await client.query({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: { category, first: 100 },
    });

    const products = (data?.products?.nodes || []).map((p: any) => ({
      id: p.databaseId || p.id,
      name: p.name,
      slug: p.slug,
      image: p.image?.sourceUrl || '',
      price: p.price || '',
      regularPrice: p.regularPrice || '',
      shortDescription: p.shortDescription || '',
    }));

    // Cache for 5 minutes at the edge and allow SWR for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(products);
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err?.message || 'Failed to load products' });
  }
}
