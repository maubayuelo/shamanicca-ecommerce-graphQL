import type { FeaturedProduct } from '../../components/sections/ProductsGrid';

/**
 * Fetch WooCommerce products via REST API.
 * Requires env: WC_STORE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET
 * Example:
 *   WC_STORE_URL=https://master.shamanicca.com
 */
export async function fetchWooProductsREST(limit = 12): Promise<FeaturedProduct[]> {
  const baseUrl = process.env.WC_STORE_URL || process.env.NEXT_PUBLIC_WC_STORE_URL || '';
  const key = process.env.WC_CONSUMER_KEY || '';
  const secret = process.env.WC_CONSUMER_SECRET || '';

  if (!baseUrl || !key || !secret) {
    return [];
  }

  const url = new URL('/wp-json/wc/v3/products', baseUrl);
  url.searchParams.set('per_page', String(limit));
  url.searchParams.set('status', 'publish');
  // Consider adding category filter here if needed

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  // Map Woo REST product -> FeaturedProduct
  const products: FeaturedProduct[] = (Array.isArray(data) ? data : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price, // string like "199.00"
    regularPrice: p.regular_price, // string
    shortDescription: p.short_description,
    image: { sourceUrl: p.images?.[0]?.src },
  }));

  return products;
}
