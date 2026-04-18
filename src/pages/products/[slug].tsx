import { useRouter } from 'next/router';
import SeoHead from '../../components/atoms/SeoHead';
import Link from 'next/link';
import React, { Fragment } from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import ProductsGrid from '../../components/sections/ProductsGrid';
import ProductImageGallery from '../../components/molecules/ProductImageGallery';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import { useCart } from '../../lib/context/cart';
import client from '../../lib/graphql/apolloClient';
import { GET_PRODUCT_BY_SLUG, GET_PRODUCT_SLUGS, GET_PRODUCTS } from '../../lib/graphql/queries';
import { decodeEntities } from '../../utils/html';

type ProductData = {
  id: string;
  databaseId?: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: { sourceUrl?: string | null } | null;
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
  const { addItem: addToCart } = useCart();

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
    
    const galleryImages: Array<{ src: string; alt?: string; thumb?: string }> = [];
    
    // Add main image
    if (product?.image?.sourceUrl) {
      galleryImages.push({
        src: product.image.sourceUrl,
        alt: displayProduct.name,
        thumb: product.image.sourceUrl,
      });
    }
    
    // Add gallery images
    if (product?.galleryImages?.nodes) {
      product.galleryImages.nodes.forEach((img) => {
        if (img?.sourceUrl) {
          galleryImages.push({
            src: img.sourceUrl,
            alt: displayProduct.name,
            thumb: img.sourceUrl,
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
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: price.toFixed(2),
          availability: isProductOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/products/${displayProduct.slug}`,
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
      <main className="product-page" role="main">
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
        <div className="main product">
          <div className="product__content">
            <ProductImageGallery 
              title={title} 
              isOnSale={!!isOnSale} 
              images={images}
              className="product__media" 
            />

            <div className="product__details">
              
              <h1 className="product__title mt-lg-responsive mb-0 type-5xl">{title}</h1>

              <div className="product__price" aria-live="polite">
                {isOnSale && <div className="regular  type-2xl">${regularPrice.toFixed(2)}</div>}
                <div className="current type-2xl">${price.toFixed(2)}</div>
                {isOnSale && <div className="badge-small type-sm">Save ${Math.max(0, regularPrice - price).toFixed(0)}</div>}
              </div>

              

              <div className="product__options">
                {hasSizeOptions && (
                  <div className={`field ${sizeError ? 'field--error' : ''}`}>
                    <label htmlFor="size">Size</label>
                    <select
                      id="size"
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
                    {sizeError && (
                      <span id="size-error" className="field-error" style={{ 
                        color: '#991b1b',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem',
                        display: 'block'
                      }}>
                        {sizeError}
                      </span>
                    )}
                  </div>
                )}

                <div className="field">
                  <label htmlFor="quantity">Quantity</label>
                  <div className="qty-control">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                      aria-live="polite"
                    />
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {isProductOutOfStock ? (
                <button className="btn btn-primary btn-large product__cta" disabled>
                  Out of Stock
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-large product__cta"
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

              <div 
                className="product__desc" 
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
              className="product__related pb-lg-responsive"
            />
        <Footer />
      </main>
      
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
