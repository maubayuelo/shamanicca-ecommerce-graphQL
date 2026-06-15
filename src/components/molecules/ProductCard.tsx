/**
 * ProductCard.tsx — Individual product tile (Molecule)
 *
 * Displays a single product in a grid or listing. This is the smallest
 * self-contained unit that represents a product visually.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * It combines two atoms (Image + Button) with product data to form
 * a meaningful, reusable component.
 *
 * USED IN:
 *  - ProductsGrid (homepage featured products)
 *  - ProductListing (shop category pages)
 *  - Search results
 *
 * PROPS:
 *  `product` — a ProductCardProduct object with:
 *    - name: display title
 *    - slug: used to build the link to the detail page (/products/:slug)
 *    - image.sourceUrl: the product thumbnail URL from WooCommerce
 *    - price: current price (string from WP like "$29.99" or number)
 *    - regularPrice: original price if on sale
 *    - shortDescription: optional teaser text
 *
 * NOTE: The console.log below is a runtime sanity check left from development
 * to confirm that Next.js Image and Button imported correctly. It can be removed
 * in a cleanup pass.
 */

import Image from 'next/image';
import Button from '../atoms/Button';

// Runtime sanity checks for imported components
try {
  // eslint-disable-next-line no-console
  console.log('[ProductCard] Image type:', typeof Image, 'Button type:', typeof Button);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('[ProductCard] Error logging imported components', e);
}

type ProductCardProduct = {
  id?: string | number;
  name: string;
  slug?: string;
  image?: { sourceUrl?: string } | null;
  price?: string | number | null;
  regularPrice?: string | number | null;
  shortDescription?: string | null;
};

export default function ProductCard({ product }: { product: ProductCardProduct }) {
  const img = product?.image?.sourceUrl || '/placeholder.png';
  const price = product?.price || product?.regularPrice || '—';
  return (
    <article className="border rounded-md overflow-hidden shadow-sm">
      <div className="relative h-48 w-full">
        <Image src={img} alt={product.name} layout="fill" objectFit="cover" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-2">{product.shortDescription}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">{price}</span>
          <Button>Buy</Button>
        </div>
      </div>
    </article>
  );
}
