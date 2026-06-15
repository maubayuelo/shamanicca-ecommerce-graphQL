/**
 * shop/[category].tsx — Shop category listing page (route: /shop/:category)
 *
 * Examples: /shop/women, /shop/men, /shop/accessories, /shop/mystical-home
 *
 * This is a dynamic route — the `category` segment maps to a WooCommerce category slug.
 *
 * DATA FETCHING:
 *  - getStaticPaths: fetches ALL product category slugs from WooCommerce at build time,
 *    generating a static page for each. `fallback: 'blocking'` handles new categories
 *    added to WooCommerce after the last build.
 *  - getStaticProps:
 *      1. Fetches all categories to validate that the requested category slug exists.
 *         If not found → returns `notFound: true` → Next.js shows the 404 page.
 *      2. Fetches all products in that category (up to 100).
 *      3. Returns products + categoryName as props to the page component.
 *  - revalidate: 300 → ISR — page regenerates every 5 minutes.
 *
 * SUBCATEGORY FILTERING (URL query param):
 *  The URL can include ?sub=t-shirts to highlight a sub-category.
 *  The `subParam` is read from the router query and used to adjust the page title
 *  (e.g. "Women — T-Shirts"). Full subcategory routes (/shop/women/t-shirts) are
 *  not implemented — all subcategory products show on the parent category page.
 *
 * LAYOUT:
 *  Header → StoreSubHeader (category title + breadcrumb) → ProductListing → Footer
 *  ProductListing handles sorting and filtering client-side.
 */

import SeoHead from '../../components/atoms/SeoHead';
import { GetStaticPaths, GetStaticProps } from 'next';
import React, { Fragment, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProductListing, { type ProductListingProduct } from '../../components/sections/ProductListing';
import StoreSubHeader from '../../components/sections/StoreSubHeader';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
// Removed SUBCATEGORY_KEYWORDS; rely on WP data only
// Removed static navigation; humanize subcategory labels directly
import client from '../../lib/graphql/apolloClient';
import { GET_PRODUCTS_BY_CATEGORY, GET_PRODUCT_CATEGORIES } from '../../lib/graphql/queries';

type Props = {
  category: string;
  categoryName: string;
  products: ProductListingProduct[];
};

export default function CategoryPage({ category, categoryName, products }: Props) {
  const router = useRouter();
  const title = categoryName;
  const subParam = typeof router.query.sub === 'string' ? router.query.sub : undefined;

  const filteredProducts = useMemo(() => {
    // No local keyword filtering; subcategory filtering should be handled via category routes
    return products;
  }, [products]);

  const subTitle = subParam ? toSubLabel(subParam) : undefined;
  const listingTitle = subTitle ? `${title} — ${subTitle}` : title;

  return (
    <Fragment>
      <SeoHead
        title={listingTitle}
        description={`Shop ${categoryName} at Shamanicca — sacred style, intentional clothing, and spiritual objects for the modern mystic.`}
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/shop/${category}`}
        ogType="website"
      />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <StoreSubHeader categoryTitle={title} subCategoryTitle={subTitle} />
          <ProductListing
            title={listingTitle}
            products={filteredProducts}
            allProductsHref={`/shop/${category}`}
          />
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Fetch actual product categories from WooCommerce
    const { data } = await client.query<any>({
      query: GET_PRODUCT_CATEGORIES,
      variables: { first: 100 },
    });

    const paths = ((data as any)?.productCategories?.nodes || [])
      .map((cat: any) => ({ params: { category: cat.slug } }));

    return {
      paths,
      fallback: 'blocking', // Generate pages on-demand for new categories
    };
  } catch (error) {
    console.error('Error fetching product category slugs:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const category = String(params?.category || '').toLowerCase();

  try {
    // Fetch all product categories to validate the requested category exists
    const { data: categoriesData } = await client.query<any>({
      query: GET_PRODUCT_CATEGORIES,
      variables: { first: 100 },
    });

    const categoryNode = ((categoriesData as any)?.productCategories?.nodes || [])
      .find((cat: any) => cat.slug.toLowerCase() === category);

    // If category doesn't exist in WP backend, return 404
    if (!categoryNode) {
      return { notFound: true, revalidate: 60 };
    }

    // Fetch products in this category
    const { data: productsData } = await client.query<any>({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: { category, first: 100 },
    });

    const products = ((productsData as any)?.products?.nodes || []).map((p: any) => ({
      id: p.databaseId || p.id,
      name: p.name,
      slug: p.slug,
      image: p.image?.sourceUrl ? { sourceUrl: p.image.sourceUrl } : null,
      price: p.price || '',
      regularPrice: p.regularPrice || '',
    }));

    return {
      props: {
        category,
        categoryName: categoryNode.name,
        products,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error(`Error fetching product category [${category}]:`, error);
    // Return 404 on error - category data must come from WP backend
    return {
      notFound: true,
      revalidate: 60,
    };
  }
};

function toSubLabel(subId: string): string {
  return subId
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
