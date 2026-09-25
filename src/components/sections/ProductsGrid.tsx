import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import Paginator from '../molecules/Paginator';
import { useWishlist } from '../../lib/context/wishlist';

export type FeaturedProduct = {
  id: string | number;
  name: string;
  slug?: string;
  image?: {
    sourceUrl?: string;
    mediaDetails?: { sizes?: Array<{ name?: string | null; sourceUrl?: string | null }> | null } | null;
  } | null;
  price?: string | number | null;
  regularPrice?: string | number | null; // if present and > price, show SALE + strikethrough
  shortDescription?: string | null;
};

export type ProductGridItem = FeaturedProduct;

export type ProductsGridProps = {
  title?: string;
  products: FeaturedProduct[];
  allProductsHref?: string;
  bestSellersHref?: string;
  className?: string;
  /**
   * When true, indicates the component is displayed on the Home page.
   * Used to render Home-only UI like the section title and the section footer CTA.
   * Defaults to true so Home keeps existing behavior; category pages should pass false.
   */
  displayingInHome?: boolean;
  /**
   * Force showing/hiding the title independently of displayingInHome.
   * Defaults to following displayingInHome when undefined.
   */
  showTitle?: boolean;
  /**
   * Force showing/hiding the footer CTA independently of displayingInHome.
   * Defaults to following displayingInHome when undefined.
   */
  showCTA?: boolean;
  /**
   * Items per page when pagination is active. Default: 6
   */
  pageSize?: number;
  /**
   * Optional controlled current page (1-based). If omitted, the grid manages its own page.
   */
  currentPage?: number;
  /**
   * Called when page changes (only used if currentPage is provided, or when consumer wants to listen).
   */
  onPageChange?: (page: number) => void;
  /**
   * If provided, paginator will render each page as a Link using this builder.
   * Useful for SSR/Next routing like (page) => `/category/slug?page=${page}`.
   */
  hrefBuilder?: (page: number) => string;
  /**
   * Optional total count if data is server-paginated; falls back to products.length.
   */
  totalCount?: number;
};

/**
 * Responsive Products Grid section
 * - Mobile: 1 column
 * - Tablet (sm/md): 2 columns
 * - Desktop (lg+): 3 columns
 * Inspired by Figma markup in _figma_code/component-product-listing.txt
 */
export default function ProductsGrid({
  title = 'Featured Products',
  products,
  bestSellersHref = '/shop/best-sellers',
  className = '',
  displayingInHome = true,
  showTitle,
  showCTA,
  pageSize = 6,
  currentPage,
  onPageChange,
  hrefBuilder,
  totalCount,
}: ProductsGridProps) {
  // Only paginate on category/listing contexts (not Home) and when over pageSize
  const totalItems = totalCount ?? products?.length ?? 0;
  const shouldPaginate = !displayingInHome && totalItems > pageSize;

  const [internalPage, setInternalPage] = React.useState(1);
  const activePage = Math.max(1, Math.min(currentPage ?? internalPage, Math.ceil(totalItems / pageSize) || 1));
  const totalPages = shouldPaginate ? Math.ceil(totalItems / pageSize) : 1;

  const startIndex = shouldPaginate ? (activePage - 1) * pageSize : 0;
  const endIndex = shouldPaginate ? startIndex + pageSize : products?.length ?? 0;
  const visibleProducts = shouldPaginate ? products.slice(startIndex, endIndex) : products;

  const handlePageChange = (page: number) => {
    if (onPageChange) onPageChange(page);
    if (currentPage == null) setInternalPage(page);
  };

  const shouldShowTitle = showTitle ?? displayingInHome;
  const shouldShowCTA = showCTA ?? displayingInHome;

  return (
    <section className={`main section-featured-products pb-lg-responsive flex flex-col ${className}`}>
      {shouldShowTitle && (
        <h2 className="type-4xl type-extrabold mt-lg-responsive mb-md-responsive text-black">{title}</h2>
      )}

      <div className="grid grid-cols-[1fr] gap-legacy-15 sm:grid-cols-[repeat(2,1fr)] lg:grid-cols-[repeat(3,1fr)] lg:gap-7.5">
        {visibleProducts?.map((p) => (
          <ProductTile key={p.id} product={p} />
        ))}
      </div>
      {shouldShowCTA && (
        <div className="mt-md-responsive mb-sm-responsive flex w-full items-center justify-center">
          <Link href={bestSellersHref} className="btn btn-secondary btn-large m-0">Check Best Sellers!</Link>
        </div>
      )}
      {/* Section paginator */}
      {shouldPaginate && totalPages > 1 && (
        <div className="section-paginator mt-md-responsive">
          <Paginator
            className=''
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={activePage}
            onPageChange={handlePageChange}
            hrefBuilder={hrefBuilder}
          />
        </div>
      )}
    </section>
  );
}

function ProductTile({ product }: { product: FeaturedProduct }) {
  const sizes = product?.image?.mediaDetails?.sizes;
  const findSize = (name: string) => sizes?.find((s) => s.name === name)?.sourceUrl;
  const img =
    findSize('large') ||
    findSize('medium_large') ||
    findSize('woocommerce_single') ||
    findSize('woocommerce_thumbnail') ||
    findSize('medium') ||
    product?.image?.sourceUrl ||
    'https://placehold.co/800x800.png?text=Product';
  const name = product?.name ?? '';
  const price = product?.price ?? undefined;
  const regularPrice = product?.regularPrice ?? undefined;
  const onSale = price != null && regularPrice != null && String(regularPrice) !== String(price);
  const href = `/products/${product?.slug || product?.id}`;

  const { toggle, isWishlisted, hydrated } = useWishlist();
  const wishlisted = hydrated && isWishlisted(String(product.id));
  const parsePrice = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const priceNum = parsePrice(price);
  const regularPriceNum = regularPrice != null ? parsePrice(regularPrice) : undefined;

  return (
    <article className="relative flex flex-col items-stretch bg-transparent pb-legacy-15">
      <Link href={href} aria-label={`View ${name}`} className="image-wrap relative block w-full aspect-square overflow-hidden after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:[box-shadow:inset_0_0_0_1px_#e0e0e0] after:z-1 after:pointer-events-none">
        {onSale && <div className="type-sm type-bold absolute z-1 top-legacy-15 left-legacy-15 px-2 py-1.5 bg-highlighted-500 text-white rounded-[10px]">SALE</div>}
        <Image className="absolute z-0 inset-0 block w-full h-full object-cover" src={img} alt={name} width={1024} height={1024} loading="lazy" sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      </Link>
      <button
        className={`btn-wishlist absolute top-2.5 right-2.5 z-[2] w-[34px] h-[34px] rounded-[999px] [border:none] [background:rgba(255,255,255,0.88)] [backdrop-filter:blur(4px)] flex items-center justify-center cursor-pointer [transition:background_0.15s,transform_0.15s] [&:hover]:bg-white [&:hover]:[transform:scale(1.1)] [&.is-wishlisted]:bg-[#e7e1ff] [&.is-wishlisted:hover]:bg-[#e7e1ff] ${wishlisted ? 'is-wishlisted' : ''}`}
        onClick={() => toggle({ id: String(product.id), name, slug: product.slug || String(product.id), price: priceNum, regularPrice: regularPriceNum, image: img })}
        aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      >
        <Image className="block w-[18px] h-[18px]" src={wishlisted ? '/images/icon-heart-full.svg' : '/images/icon-heart.svg'} alt="" width={18} height={18} aria-hidden />
      </button>
      <div className="flex flex-col">
        <h3 className="type-lg type-bold mt-sm-responsive mb-xs-responsive text-black">
          <Link href={href} aria-label={`View ${name}`}>{name}</Link>
        </h3>
        <div className="inline-flex items-start gap-legacy-15">
          {onSale && <span className="type-lg text-black line-through opacity-80">{formatPrice(regularPrice)}</span>}
          <span className="type-lg text-black">{formatPrice(price)}</span>
        </div>
      </div>
    </article>
  );
}

function formatPrice(value: unknown): string {
  if (value == null) return '';
  const n = Number(value);
  if (Number.isFinite(n)) return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  // assume string like "$199"
  return String(value);
}
