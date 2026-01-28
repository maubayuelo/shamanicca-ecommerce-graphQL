import Head from 'next/head';
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
      <Head>
        <title>{listingTitle} — Shamanicca</title>
      </Head>
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
