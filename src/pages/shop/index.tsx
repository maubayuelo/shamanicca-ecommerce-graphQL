import Head from 'next/head';
import { GetStaticProps } from 'next';
import React, { Fragment, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProductListing, { type ProductListingProduct } from '../../components/sections/ProductListing';
import StoreSubHeader from '../../components/sections/StoreSubHeader';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
// Removed SUBCATEGORY_KEYWORDS; rely on WP data only
// Removed static navigation; humanize subcategory labels directly
import client from '../../lib/graphql/apolloClient';
import { GET_PRODUCTS } from '../../lib/graphql/queries';

type Props = {
  products: ProductListingProduct[];
};

export default function ShopPage({ products }: Props) {
  const router = useRouter();
  const categoryParam = typeof router.query.category === 'string' ? router.query.category.toLowerCase() : undefined;
  const subParam = typeof router.query.sub === 'string' ? router.query.sub : undefined;

  const filteredProducts = useMemo(() => {
    // No local keyword filtering; subcategory filtering should be handled via category routes
    return products;
  }, [products]);

  const subTitle = subParam ? toSubLabel(subParam) : undefined;
  const categoryTitle = 'Shop';
  const listingTitle = subTitle ? `${categoryTitle} — ${subTitle}` : categoryTitle;

  return (
    <Fragment>
      <Head>
        <title>{listingTitle} — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <StoreSubHeader categoryTitle={categoryTitle} subCategoryTitle={subTitle} />
          <ProductListing
            title={listingTitle}
            products={filteredProducts}
            allProductsHref={`/shop`}
          />
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    // Fetch all products from WooCommerce
    const { data } = await client.query({
      query: GET_PRODUCTS,
      variables: { first: 100 },
    });

    const products = (data?.products?.nodes || []).map((p: any) => ({
      id: p.databaseId || p.id,
      name: p.name,
      slug: p.slug,
      image: p.image?.sourceUrl ? { sourceUrl: p.image.sourceUrl } : null,
      price: p.price || '',
      regularPrice: p.regularPrice || '',
    }));

    return {
      props: {
        products,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error('Error fetching products for shop page:', error);
    // Return empty products list on error - data must come from WP backend
    return {
      props: {
        products: [],
      },
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
