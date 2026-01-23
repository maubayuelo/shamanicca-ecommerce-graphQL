import type { NextApiRequest, NextApiResponse } from 'next';
import client from '../../../lib/graphql/apolloClient';
import { GET_PRODUCT_CATEGORIES } from '../../../lib/graphql/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data } = await client.query({ query: GET_PRODUCT_CATEGORIES, variables: { first: 100 } });
    const cats = (data.productCategories?.nodes || []).map((c: any) => ({
      id: c.databaseId,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      parent: c.parentDatabaseId || 0,
      count: c.count || 0,
      menuOrder: c.menuOrder || 0,
    }));
    // Sort by menuOrder
    cats.sort((a: any, b: any) => a.menuOrder - b.menuOrder);
    // Cache for 5 minutes at the edge and allow SWR for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load product categories' });
  }
}
