// Generic ProductListing component reusing the ProductsGrid component
// Keeps a friendly name for category pages without duplicating logic
import ProductsGrid, { type FeaturedProduct } from './ProductsGrid';

export type ProductListingProduct = FeaturedProduct;

export type ProductListingProps = {
  title?: string;
  products: ProductListingProduct[];
  allProductsHref?: string;
  className?: string;
};

export default function ProductListing(props: ProductListingProps) {
  // Reuse ProductsGrid; for category pages, hide Home-only UI (title/footer).
  return <ProductsGrid {...props} displayingInHome={false} />;
}
