import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import React, { Fragment, useMemo } from 'react';
import { useRouter } from 'next/router';
import ProductListing, { type ProductListingProduct } from '../../components/sections/ProductListing';
import ProductsGrid from '../../components/sections/ProductsGrid';
import StoreSubHeader from '../../components/sections/StoreSubHeader';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import { FEATURED_PRODUCTS_MOCK } from '../../utils/mockProducts';
import { SUBCATEGORY_KEYWORDS } from '../../utils/productSubcategories';
import navigation from '../../utils/navigation';

// Add 'mystical-home' so the top-level navigation route works, plus 'best-sellers'.
const CATEGORIES = ['women', 'men', 'accessories', 'mystical-home', 'best-sellers'] as const;

type Category = (typeof CATEGORIES)[number];

type Props = {
  category: Category;
  products: ProductListingProduct[];
};

export default function CategoryPage({ category, products }: Props) {
  const router = useRouter();
  const title = toTitle(category);
  const subParam = typeof router.query.sub === 'string' ? router.query.sub : undefined;

  const filteredProducts = useMemo(() => {
    if (!subParam) return products;
    const keywords = SUBCATEGORY_KEYWORDS[subParam];
    if (!keywords || !keywords.length) return products;
    const normKeywords = keywords.map((k) => k.toLowerCase());
    return products.filter((p) => {
      const hay = `${p.name} ${p.slug}`.toLowerCase();
      return normKeywords.some((kw) => hay.includes(kw));
    });
  }, [products, subParam]);

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
          {category === 'best-sellers' ? (
            <ProductsGrid
              title={title}
              products={filteredProducts}
              displayingInHome={false}
              showCTA={false}
              showTitle={false}
              allProductsHref={`/shop/${category}`}
            />
          ) : (
            <ProductListing
              title={subTitle ? `${title} — ${subTitle}` : title}
              products={filteredProducts}
              allProductsHref={`/shop/${category}`}
            />
          )}
          <Footer />
        </main>
      </div>
    </Fragment>
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
  if (category === 'best-sellers') {
    const best = all.filter((p: any) => p.bestSeller === true);
    return normalize(best);
  }
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
  return normalize(list);
}

function normalize(list: any[]): ProductListingProduct[] {
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    price: p.price,
    regularPrice: p.regularPrice,
  }));
}

function toSubLabel(subId: string): string {
  for (const parent of navigation) {
    if (!Array.isArray(parent.children)) continue;
    const found = parent.children.find((c) => c.id === subId);
    if (found) return found.label;
  }
  // Fallback: humanize slug portion
  return subId
    .split('-')
    .filter((p) => !['men','women','acc','altar','mystic'].includes(p))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
