/**
 * products/[slug].tsx — Product detail page (route: /products/:slug)
 *
 * [slug] is a dynamic route segment — Next.js replaces it with the actual
 * product slug from the URL (e.g. /products/sacred-hoodie → slug = "sacred-hoodie").
 *
 * DATA FETCHING:
 *  - getStaticPaths: pre-generates a page for every product slug from WooCommerce
 *    at build time. `fallback: 'blocking'` means if a product is added to WooCommerce
 *    after the build, the first visitor waits while Next.js generates it server-side,
 *    then caches it for all future visitors.
 *  - getStaticProps: fetches the full product details + a batch of related products
 *    server-side. Returns `notFound: true` if the slug doesn't match any product
 *    (Next.js renders the 404 page automatically).
 *  - revalidate: 300 → ISR — the page is regenerated every 5 minutes in the background.
 *
 * KEY FEATURES OF THIS PAGE:
 *
 *  1. IMAGE GALLERY:
 *     WordPress/WooCommerce stores each image in multiple sizes (thumbnail, medium,
 *     woocommerce_single, large). This page picks the best available size for desktop
 *     vs. mobile using the `pickSize()` utility.
 *
 *  2. SIZE SELECTOR:
 *     WooCommerce VariableProducts have `variations.nodes[]`, each with attributes
 *     (name: "size", value: "M") and stockStatus ("IN_STOCK" / "OUT_OF_STOCK").
 *     This page filters to only show in-stock sizes, and auto-selects if only one exists.
 *
 *  3. STICKY ADD TO BAG BAR:
 *     Uses `IntersectionObserver` to watch when the main "Add to Bag" button scrolls
 *     out of view — when it does, a sticky bar appears at the bottom of the viewport.
 *     This improves mobile UX so the CTA is always accessible while scrolling.
 *
 *  4. WISHLIST TOGGLE:
 *     Uses the WishlistContext `toggle()` method — adds if not in wishlist, removes if it is.
 *     The heart icon switches between outlined and filled based on `isWishlisted()`.
 *     Only shown after `hydrated: true` to prevent SSR mismatch.
 *
 *  5. BREADCRUMB:
 *     WooCommerce returns `productCategories.nodes[]` — each node may have a `parent`
 *     field pointing to its parent category. This logic builds a 2-level breadcrumb
 *     (e.g. Shop → Women → Hoodies) from that hierarchy.
 *
 *  6. SEO:
 *     - Product schema (schema.org/Product) with price, availability, brand
 *     - BreadcrumbList schema for Google rich results
 *     - og:type = "product" for social sharing cards
 *     - Canonical URL to prevent duplicate content issues
 *
 *  7. RELATED PRODUCTS:
 *     Fetched from WooCommerce at build time, displayed in a "You might also like" grid.
 */

import { useRouter } from 'next/router';
import SeoHead from '../../components/atoms/SeoHead';
import React, { Fragment } from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import ProductsGrid from '../../components/sections/ProductsGrid';
import ProductImageGallery from '../../components/molecules/ProductImageGallery';
import ProductStickyBar from '../../components/molecules/ProductStickyBar';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import { useCart } from '../../lib/context/cart';
import { useWishlist } from '../../lib/context/wishlist';
import client from '../../lib/graphql/apolloClient';
import { GET_PRODUCT_BY_SLUG, GET_PRODUCT_SLUGS, GET_PRODUCTS } from '../../lib/graphql/queries';
import { decodeEntities } from '../../utils/html';
import { pickSize } from '../../lib/graphql/utils';

type ProductData = {
  id: string;
  databaseId?: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: {
    sourceUrl?: string | null;
    mediaDetails?: { sizes?: Array<{ name?: string | null; sourceUrl?: string | null }> | null } | null;
  } | null;
  galleryImages?: {
    nodes?: Array<{
      sourceUrl?: string | null;
      mediaDetails?: { sizes?: Array<{ sourceUrl?: string | null; name?: string | null }> | null } | null;
    }> | null;
  } | null;
  productCategories?: {
    nodes?: Array<{
      name: string;
      slug: string;
      parent?: { node?: { name: string; slug: string } | null } | null;
    }> | null;
  } | null;
  price?: string | null;
  regularPrice?: string | null;
  onSale?: boolean | null;
};

type PageProps = {
  product: ProductData | null;
  relatedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    regularPrice?: number;
  }>;
};

export default function ProductPage({ product: productProp, relatedProducts }: PageProps) {
  const router = useRouter();

  // Use product from props (fetched server-side)
  const product = productProp;
  const displayProduct = product;

  const title = displayProduct?.name || 'Product';
  const price = displayProduct?.price ? parseFloat(String(displayProduct.price).replace(/[^0-9.]/g, '')) : 0;
  const regularPrice = displayProduct?.regularPrice 
    ? parseFloat(String(displayProduct.regularPrice).replace(/[^0-9.]/g, '')) 
    : price;
  const isOnSale = regularPrice > price;

  const [size, setSize] = React.useState<string>('');
  const [qty, setQty] = React.useState<number>(1);
  const [sizeError, setSizeError] = React.useState<string>('');
  const [showStickyBar, setShowStickyBar] = React.useState(false);
  const ctaRef = React.useRef<HTMLButtonElement>(null);
  const { addItem: addToCart } = useCart();
  const { toggle, isWishlisted, hydrated } = useWishlist();
  const wishlistId = String(product?.databaseId ?? product?.id ?? '');
  const wishlisted = hydrated && !!wishlistId && isWishlisted(wishlistId);

  // Show sticky bar when the main CTA scrolls out of view
  React.useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Use related products from WP props
  const related = React.useMemo(() => {
    return (relatedProducts || []).map(p => ({
      ...p,
      image: p.image ? { sourceUrl: p.image } : null,
    }));
  }, [relatedProducts]);

  // Build a 2-level breadcrumb from WooCommerce productCategories.
  // Each node now includes its parent, so we can correctly determine the hierarchy:
  //   root category (no parent)  →  leaf category (has parent)
  // If WooCommerce returns only leaf nodes (parent is omitted from response), we fall
  // back to using the first node's own parent field directly.
  const categoryNodes = product?.productCategories?.nodes || [];

  const { breadcrumbParent, breadcrumbLeaf } = React.useMemo(() => {
    if (categoryNodes.length === 0) return { breadcrumbParent: null, breadcrumbLeaf: null };

    // Separate nodes that have a WC parent from those that don't
    const roots = categoryNodes.filter((n) => !n.parent?.node);
    const leaves = categoryNodes.filter((n) => !!n.parent?.node);

    if (leaves.length > 0) {
      // Use the first leaf and its declared parent
      const leaf = leaves[0];
      const parentNode = leaf.parent!.node!;
      // Prefer the matching root node if it was also returned; otherwise use the parent embedded in the leaf
      const root = roots.find((r) => r.slug === parentNode.slug) ?? parentNode;
      return {
        breadcrumbParent: { label: root.name, href: `/shop/${root.slug}` },
        breadcrumbLeaf: { label: leaf.name, href: `/shop/${leaf.slug}` },
      };
    }

    // No leaves found — all nodes are roots (flat structure or single category)
    // Deduplicate by name, then show at most two levels
    const unique = roots.filter(
      (n, idx, arr) => arr.findIndex((x) => x.name === n.name) === idx,
    );
    if (unique.length === 1) {
      return {
        breadcrumbParent: { label: unique[0].name, href: `/shop/${unique[0].slug}` },
        breadcrumbLeaf: null,
      };
    }
    return {
      breadcrumbParent: { label: unique[0].name, href: `/shop/${unique[0].slug}` },
      breadcrumbLeaf: { label: unique[1].name, href: `/shop/${unique[1].slug}` },
    };
  }, [categoryNodes]);

  // Build images array for gallery
  const images = React.useMemo(() => {
    if (!displayProduct) return undefined;

    type WPSizes = Array<{ name?: string | null; sourceUrl?: string | null }> | null | undefined;

    // Best large src for desktop/tablet — prefer the original upload so the
    // ~600-720px gallery column (and any retina display) isn't upscaled from
    // WC's 600px "woocommerce_single" crop, which is what caused the pixelation.
    const bestLarge = (sizes: WPSizes, fallback: string): string =>
      fallback ||
      pickSize(sizes, 'large', null) ||
      pickSize(sizes, 'woocommerce_single', null) ||
      pickSize(sizes, 'medium_large', null);

    // Best medium src for mobile
    const bestMedium = (sizes: WPSizes, fallback: string): string =>
      pickSize(sizes, 'woocommerce_thumbnail', null) ||
      pickSize(sizes, 'medium', null) ||
      fallback;

    const galleryImages: Array<{ src: string; fullSrc?: string; alt?: string; thumb?: string; sources?: Array<{ srcSet: string; media?: string }> }> = [];

    // Add main image
    if (product?.image?.sourceUrl) {
      const sizes = product.image.mediaDetails?.sizes;
      const large = bestLarge(sizes, product.image.sourceUrl);
      const medium = bestMedium(sizes, product.image.sourceUrl);
      galleryImages.push({
        src: large,
        fullSrc: product.image.sourceUrl,
        alt: displayProduct.name,
        thumb: pickSize(sizes, 'thumbnail', product.image.sourceUrl)!,
        sources: [{ srcSet: medium, media: '(max-width: 600px)' }],
      });
    }

    // Add gallery images
    if (product?.galleryImages?.nodes) {
      product.galleryImages.nodes.forEach((img) => {
        if (img?.sourceUrl) {
          const sizes = img.mediaDetails?.sizes;
          const large = bestLarge(sizes, img.sourceUrl);
          const medium = bestMedium(sizes, img.sourceUrl);
          galleryImages.push({
            src: large,
            fullSrc: img.sourceUrl,
            alt: displayProduct.name,
            thumb: pickSize(sizes, 'thumbnail', img.sourceUrl)!,
            sources: [{ srcSet: medium, media: '(max-width: 600px)' }],
          });
        }
      });
    }

    return galleryImages.length > 0 ? galleryImages : undefined;
  }, [displayProduct, product]);

  // Derive available sizes (IN_STOCK only, uppercase) and detect full out-of-stock.
  const { availableSizes, isProductOutOfStock } = React.useMemo(() => {
    if (!product) return { availableSizes: [], isProductOutOfStock: false };
    const p = product as any;

    // Priority 1: variations — filter to IN_STOCK, normalize to uppercase
    if (p.variations?.nodes?.length) {
      const allSizes: string[] = [];
      const inStockSizes: string[] = [];
      p.variations.nodes.forEach((variation: any) => {
        variation.attributes?.nodes?.forEach((attr: any) => {
          if (attr.name?.toLowerCase().includes('size') && attr.value) {
            const s = attr.value.toUpperCase();
            if (!allSizes.includes(s)) allSizes.push(s);
            if (variation.stockStatus === 'IN_STOCK' && !inStockSizes.includes(s)) {
              inStockSizes.push(s);
            }
          }
        });
      });
      if (allSizes.length > 0) {
        return {
          availableSizes: inStockSizes.sort(),
          isProductOutOfStock: inStockSizes.length === 0,
        };
      }
    }

    // Priority 2: product-level attributes (no per-size stock — assume available)
    if (p.attributes?.nodes?.length) {
      const sizeAttr = p.attributes.nodes.find(
        (attr: any) => attr.name?.toLowerCase().includes('size'),
      );
      if (sizeAttr?.options?.length) {
        return {
          availableSizes: sizeAttr.options.map((s: string) => s.toUpperCase()),
          isProductOutOfStock: false,
        };
      }
    }

    // Simple product — use product-level stockStatus
    return {
      availableSizes: [],
      isProductOutOfStock: !!(p.stockStatus && p.stockStatus !== 'IN_STOCK'),
    };
  }, [product]);

  // A size selector is shown and required whenever the product has in-stock size options.
  const hasSizeOptions = availableSizes.length > 0;

  // Get product description
  const description = React.useMemo(() => {
    if (product?.description) {
      return decodeEntities(product.description);
    }
    if (product?.shortDescription) {
      return decodeEntities(product.shortDescription);
    }
    return '';
  }, [product]);

  // Auto-select size when there is only one option
  React.useEffect(() => {
    if (hasSizeOptions && availableSizes.length === 1 && !size) {
      setSize(availableSizes[0]);
    }
  }, [availableSizes, hasSizeOptions, size]);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com';

  const productSchema = displayProduct
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description: displayProduct.shortDescription
          ? displayProduct.shortDescription.replace(/<[^>]+>/g, '')
          : undefined,
        image: displayProduct.image?.sourceUrl ?? undefined,
        brand: {
          '@type': 'Brand',
          name: 'Shamanicca',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: price.toFixed(2),
          availability: isProductOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/products/${displayProduct.slug}`,
          seller: {
            '@type': 'Organization',
            name: 'Shamanicca',
            url: SITE_URL,
          },
        },
      }
    : undefined;

  const breadcrumbSchema = React.useMemo(() => {
    const items: Record<string, unknown>[] = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
    ];
    if (breadcrumbParent) {
      items.push({ '@type': 'ListItem', position: 3, name: breadcrumbParent.label, item: `${SITE_URL}${breadcrumbParent.href}` });
    }
    if (breadcrumbLeaf) {
      items.push({ '@type': 'ListItem', position: items.length + 1, name: breadcrumbLeaf.label, item: `${SITE_URL}${breadcrumbLeaf.href}` });
    }
    if (displayProduct) {
      items.push({ '@type': 'ListItem', position: items.length + 1, name: title });
    }
    return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
  }, [breadcrumbParent, breadcrumbLeaf, displayProduct, title, SITE_URL]);

  return (
    <Fragment>
      <SeoHead
        title={`${title} — Shamanicca`}
        description={
          displayProduct?.shortDescription
            ? displayProduct.shortDescription.replace(/<[^>]+>/g, '').slice(0, 160)
            : `Shop ${title} at Shamanicca — intentioned mystical style.`
        }
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/products/${displayProduct?.slug ?? ''}`}
        ogImage={displayProduct?.image?.sourceUrl ?? null}
        ogType="product"
        jsonLd={[...(productSchema ? [productSchema] : []), breadcrumbSchema]}
      />
      <Header />
      <main className="w-full" role="main">
        <div className='main'>
          <Breadcrumb
            className="breadcrumb type-xs pt-sm-responsive pb-sm-responsive"
            items={[
              { label: 'Home', href: '/' },
              breadcrumbParent ?? { label: 'Collection' },
              ...(breadcrumbLeaf ? [breadcrumbLeaf] : []),
            ]}
            linkLast={true}
          />
        </div>
        <div className="main">
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[44%_1fr] lg:gap-15 lg:items-start xl:grid-cols-[minmax(0,720px)_1fr]">
            <ProductImageGallery 
              title={title} 
              isOnSale={!!isOnSale} 
              images={images}
            />

            <div className="flex flex-col gap-7.5 overflow-hidden">
              
              <h1 className="mt-lg-responsive mb-0 type-5xl type-antialiased font-black text-black">{title}</h1>

              <div className="flex gap-3 items-center" aria-live="polite">
                {isOnSale && <div className="type-2xl type-antialiased font-semibold text-gray-600 line-through">${regularPrice.toFixed(2)}</div>}
                <div className="type-2xl type-antialiased font-black text-black">${price.toFixed(2)}</div>
                {isOnSale && <div className="type-sm px-2 py-0.75 rounded-lg bg-[#e7e1ff] text-primary-800">Save ${Math.max(0, regularPrice - price).toFixed(0)}</div>}
              </div>

              

              <div className="product__options grid grid-cols-[1fr] gap-7.5 sm:grid-cols-[180px_1fr]">
                {hasSizeOptions && (
                  <div className={`field grid gap-2 content-start ${sizeError ? 'field--error' : ''}`}>
                    <label htmlFor="size" className="text-sm font-semibold text-black">Size</label>
                    <select
                      id="size"
                      className="w-full py-2.5 px-3 bg-white border border-gray-300 rounded-[10px] shadow-[0_3px_6px_-3px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)] outline-none focus:border-[#675dff] focus:shadow-[0_0_0_3px_rgba(103,93,255,0.1)]"
                      value={size}
                      onChange={(e) => {
                        setSize(e.target.value);
                        setSizeError('');
                      }}
                      aria-label="Select size"
                      aria-invalid={!!sizeError}
                      aria-describedby={sizeError ? 'size-error' : undefined}
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {availableSizes.map((sizeOption: string) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
                    <span id="size-error" className="block min-h-5 text-[0.875rem] text-[oklch(0.4437_0.1613_26.9)]" aria-live="polite">
                      {sizeError}
                    </span>
                  </div>
                )}

                <div className="field grid gap-2 content-start">
                  <label htmlFor="quantity" className="text-sm font-semibold text-black">Quantity</label>
                  <div className="inline-flex items-center gap-2.5">
                    <button
                      type="button"
                      className="size-9 rounded-lg border border-gray-300 bg-white cursor-pointer"
                      aria-label="Decrease quantity"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input
                      id="quantity"
                      className="w-17.5 text-center py-2.5 px-3 bg-white border border-gray-300 rounded-[10px] shadow-[0_3px_6px_-3px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)] outline-none focus:border-[#675dff] focus:shadow-[0_0_0_3px_rgba(103,93,255,0.1)]"
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                      aria-live="polite"
                    />
                    <button
                      type="button"
                      className="size-9 rounded-lg border border-gray-300 bg-white cursor-pointer"
                      aria-label="Increase quantity"
                      onClick={() => setQty((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {isProductOutOfStock ? (
                <button ref={ctaRef} className="btn btn-primary btn-large product__cta w-full" disabled>
                  Out of Stock
                </button>
              ) : (
                <button
                  ref={ctaRef}
                  className="btn btn-primary btn-large product__cta w-full"
                  onClick={() => {
                    if (!product) return;
                    if (hasSizeOptions && !size) {
                      setSizeError('Please select a size');
                      return;
                    }
                    addToCart({
                      product: {
                        id: String(product.databaseId ?? product.id),
                        name: product.name,
                        slug: product.slug,
                        price: price,
                        image: product.image,
                      },
                      qty,
                      options: { size: hasSizeOptions ? size : undefined },
                    });
                    router.push('/cart');
                  }}
                >
                  ADD TO BAG
                </button>
              )}

              <button
                className={`product__wishlist-btn flex w-full items-center justify-center gap-2.5 py-3.5 px-5 border-[1.5px] rounded-[10px] cursor-pointer [font-family:Poppins,sans-serif] text-sm font-semibold transition-[border-color,color,background] duration-150 ease-[ease] ${wishlisted ? 'is-wishlisted border-[#675dff] bg-[#e7e1ff] text-[#675dff]' : 'border-gray-300 bg-transparent text-black [&:hover]:border-[#675dff] [&:hover]:text-[#675dff]'}`}
                onClick={() => {
                  if (!product || !wishlistId) return;
                  toggle({
                    id: wishlistId,
                    name: title,
                    slug: product.slug,
                    price,
                    regularPrice: isOnSale ? regularPrice : undefined,
                    image: product.image?.sourceUrl ?? null,
                  });
                }}
                aria-label={wishlisted ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
              >
                <Image
                  src={wishlisted ? '/images/icon-heart-full.svg' : '/images/icon-heart.svg'}
                  alt=""
                  width={18}
                  height={18}
                  className="block shrink-0"
                  aria-hidden
                />
                {wishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>

              <div 
                className="product__desc type-lg font-normal text-black [&_a]:text-[#675dff] [&_a]:font-black [&_a]:underline" 
                dangerouslySetInnerHTML={{ __html: description }}
              />
              
            </div>
          </div>
        </div>
          <ProductsGrid
              title="You might also like"
              products={related.slice(0, 3)}
              displayingInHome={false}
              pageSize={3}
              showTitle
              showCTA={false}
              className="pb-lg-responsive"
            />
        <Footer />
      </main>

      <ProductStickyBar
        name={title}
        price={price}
        regularPrice={isOnSale ? regularPrice : undefined}
        isOnSale={isOnSale}
        isOutOfStock={isProductOutOfStock}
        visible={showStickyBar}
        onAddToBag={() => {
          if (!product) return;
          if (hasSizeOptions && !size) {
            setSizeError('Please select a size');
            ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          addToCart({
            product: {
              id: String(product.databaseId ?? product.id),
              name: product.name,
              slug: product.slug,
              price,
              image: product.image,
            },
            qty,
            options: { size: hasSizeOptions ? size : undefined },
          });
          router.push('/cart');
        }}
      />
    </Fragment>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { data } = await client.query({ query: GET_PRODUCT_SLUGS, variables: { first: 100 } });
    const slugs = ((data as any).products?.nodes || []).map((p: any) => p.slug).filter(Boolean);
    const paths = slugs.map((slug: string) => ({ params: { slug } }));
    return {
      paths,
      fallback: 'blocking', // Generate pages on-demand for products not in initial build
    };
  } catch (error) {
    console.error('Error fetching product slugs:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async (ctx) => {
  try {
    const slug = ctx.params?.slug as string;
    if (!slug) {
      return { notFound: true };
    }

    // Fetch the product by slug
    const { data } = await client.query({
      query: GET_PRODUCT_BY_SLUG,
      variables: { slug },
    });

    const productData = (data as any).product;

    if (!productData) {
      return { notFound: true };
    }

    // Fetch related products (random selection from all products)
    const { data: relatedData } = await client.query({
      query: GET_PRODUCTS,
      variables: { first: 8 },
    });

    const relatedProducts = ((relatedData as any).products?.nodes || [])
      .filter((p: any) => p.slug !== slug)
      .slice(0, 4)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image?.sourceUrl || null,
        price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0,
        regularPrice: p.regularPrice 
          ? parseFloat(String(p.regularPrice).replace(/[^0-9.]/g, ''))
          : undefined,
      }));

    return {
      props: {
        product: productData,
        relatedProducts,
      },
      revalidate: 300, // Revalidate every 5 minutes
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      notFound: true,
      revalidate: 60,
    };
  }
};
