import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import React from 'react';
import ProductListing, { type ProductListingProduct } from '../../components/sections/ProductListing';
import StoreSubHeader from '../../components/sections/StoreSubHeader';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import { FEATURED_PRODUCTS_MOCK } from '../../utils/mockProducts';

// Add 'mystical-home' so the top-level navigation route works.
const CATEGORIES = ['women', 'men', 'accessories', 'mystical-home'] as const;

type Category = (typeof CATEGORIES)[number];

type Props = {
  category: Category;
  products: ProductListingProduct[];
};

export default function CategoryPage({ category, products }: Props) {
  const title = toTitle(category);
  return (
    <>
      <Head>
        <title>{title} — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <StoreSubHeader title={title} />
          <ProductListing title={title} products={products} allProductsHref={`/shop/${category}`} />
          <Footer />
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = CATEGORIES.map((category) => ({ params: { category } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const category = String(params?.category || '').toLowerCase() as Category;
  if (!CATEGORIES.includes(category)) {
    return { notFound: true };
  }

  // Simple mock mapping: filter by name keywords; if none, just take a sample
  const products = pickProductsForCategory(category);

  return {
    props: {
      category,
      products,
    },
    revalidate: 60, // safe revalidate for when hooked to API
  };
};

function toTitle(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function pickProductsForCategory(category: Category): ProductListingProduct[] {
  const all = FEATURED_PRODUCTS_MOCK;
  const byKeyword = all.filter((p) => {
    const name = (p.name || '').toLowerCase();
    switch (category) {
      case 'women':
        return name.includes('women') || name.includes('darlin') || name.includes('veil');
      case 'men':
        return name.includes('hoodie') || name.includes('urban') || name.includes('street');
      case 'accessories':
        return name.includes('accessor');
      case 'mystical-home':
        return (
          name.includes('mug') ||
          name.includes('water bottle') || name.includes('bottle') ||
          name.includes('wall art') || name.includes('poster') || name.includes('print') || name.includes('canvas') ||
          name.includes('sticker') || name.includes('tapestry') ||
          name.includes('talisman') || name.includes('pendant') || name.includes('necklace') || name.includes('amulet') ||
          name.includes('candle') ||
          name.includes('crystal')
        );
    }
  });
  // Use full list so the grid can paginate when > pageSize
  const list = byKeyword.length ? byKeyword : all;
  // Normalize fields expected by ProductListing
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    price: p.price,
    regularPrice: p.regularPrice,
  }));
}
