import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React, { Fragment } from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { FEATURED_PRODUCTS_MOCK } from '../../utils/mockProducts';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import ProductsGrid from '../../components/sections/ProductsGrid';
import ProductImageGallery from '../../components/molecules/ProductImageGallery';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import { getSubcategoryBadges } from '../../utils/productSubcategories';
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
    nodes?: Array<{ name: string; slug: string }> | null;
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
  const { slug } = router.query as { slug?: string };

  // Use product from props (fetched server-side)
  const product = productProp;

  // Fallback to mock data if no product from CMS (for development)
  const mockProduct = React.useMemo(() => {
    if (!slug || product) return undefined;
    return FEATURED_PRODUCTS_MOCK.find((p) => p.slug === slug || String(p.id) === slug);
  }, [slug, product]);

  const displayProduct = product || mockProduct;

  const title = displayProduct?.name || 'Product';
  const price = displayProduct?.price ? parseFloat(String(displayProduct.price).replace(/[^0-9.]/g, '')) : 0;
  const regularPrice = displayProduct?.regularPrice 
    ? parseFloat(String(displayProduct.regularPrice).replace(/[^0-9.]/g, '')) 
    : price;
  const isOnSale = regularPrice > price;

  const [size, setSize] = React.useState<string>('');
  const [qty, setQty] = React.useState<number>(1);
  const { addItem: addToCart } = useCart();

  // Use related products from props or fallback to mock
  const related = React.useMemo(() => {
    if (relatedProducts && relatedProducts.length > 0) {
      // Convert to FeaturedProduct format
      return relatedProducts.map(p => ({
        ...p,
        image: p.image ? { sourceUrl: p.image } : null,
      }));
    }
    return FEATURED_PRODUCTS_MOCK.filter((p) => p.slug !== displayProduct?.slug).slice(0, 4);
  }, [relatedProducts, displayProduct?.slug]);

  // Extract categories from CMS data
  const categories = React.useMemo(() => {
    if (product?.productCategories?.nodes) {
      return product.productCategories.nodes.map(cat => cat.name);
    }
    return (mockProduct as any)?.categories || [];
  }, [product, mockProduct]);

  const topCategory = categories[0];
  const subcategoryBadge = React.useMemo(() => {
    if (!displayProduct) return undefined;
    const badges = getSubcategoryBadges({ 
      name: displayProduct.name, 
      slug: displayProduct.slug, 
      categories 
    }, 1);
    return badges[0];
  }, [displayProduct, categories]);

  const categoryHref = topCategory
    ? `/shop/${topCategory.toLowerCase().replace(/\s+/g, '-')}`
    : undefined;

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
    
    // Fallback to mock product image
    if (galleryImages.length === 0 && (mockProduct as any)?.image) {
      galleryImages.push({
        src: (mockProduct as any).image,
        alt: displayProduct.name,
        thumb: (mockProduct as any).image,
      });
    }
    
    return galleryImages.length > 0 ? galleryImages : undefined;
  }, [displayProduct, product, mockProduct]);

  // Extract available sizes from product variations
  const availableSizes = React.useMemo(() => {
    if (!product) return ['XS', 'S', 'M', 'L', 'XL']; // Default sizes for mock data
    
    const variableProduct = product as any;
    if (variableProduct.variations?.nodes) {
      const sizeSet = new Set<string>();
      variableProduct.variations.nodes.forEach((variation: any) => {
        variation.attributes?.nodes?.forEach((attr: any) => {
          if (attr.name?.toLowerCase().includes('size') && attr.value) {
            sizeSet.add(attr.value);
          }
        });
      });
      if (sizeSet.size > 0) {
        return Array.from(sizeSet).sort();
      }
    }
    
    // Check attributes for size options
    if (variableProduct.attributes?.nodes) {
      const sizeAttr = variableProduct.attributes.nodes.find(
        (attr: any) => attr.name?.toLowerCase().includes('size')
      );
      if (sizeAttr?.options && sizeAttr.options.length > 0) {
        return sizeAttr.options;
      }
    }
    
    return ['XS', 'S', 'M', 'L', 'XL']; // Default fallback
  }, [product]);

  // Get product description
  const description = React.useMemo(() => {
    if (product?.description) {
      return decodeEntities(product.description);
    }
    if (product?.shortDescription) {
      return decodeEntities(product.shortDescription);
    }
    // Fallback description
    return `This ${displayProduct?.name || 'product'} is crafted with care and designed to bring positivity and protection. For size assistance, check our size chart.`;
  }, [product, displayProduct]);

  // Auto-select size if only one option is available
  React.useEffect(() => {
    if (availableSizes.length === 1 && !size) {
      setSize(availableSizes[0]);
    }
  }, [availableSizes, size]);

  return (
    <Fragment>
      <Head>
        <title>{title} — Shamanicca</title>
      </Head>
      <Header />
      <main className="product-page" role="main">
        <div className='main'>
          <Breadcrumb
            className="breadcrumb type-xs pt-sm-responsive pb-sm-responsive"
            items={[
              { label: 'Home', href: '/' },
              topCategory && categoryHref
                ? { label: topCategory, href: categoryHref }
                : { label: 'Collection' },
              ...(subcategoryBadge ? [{ label: subcategoryBadge.label, href: subcategoryBadge.href }] : []),
            ]}
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
                {availableSizes.length > 1 && (
                  <div className="field">
                    <label htmlFor="size">Size</label>
                    <select
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      aria-label="Select size"
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {availableSizes.map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </option>
                      ))}
                    </select>
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

              <button
                className="btn btn-primary btn-large product__cta"
                onClick={() => {
                  if (!displayProduct) return;
                  // Only require size if there are multiple sizes
                  if (availableSizes.length > 1 && !size) {
                    alert('Please select a size');
                    return;
                  }
                  addToCart({
                    product: {
                      id: String(displayProduct.id),
                      name: displayProduct.name,
                      slug: displayProduct.slug,
                      price: price,
                      image: typeof displayProduct.image === 'string' 
                        ? { sourceUrl: displayProduct.image }
                        : displayProduct.image,
                    },
                    qty,
                    options: { size },
                  });
                  router.push('/cart');
                }}
              >
                ADD TO BAG
              </button>

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
