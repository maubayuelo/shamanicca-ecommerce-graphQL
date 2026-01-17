import { Fragment } from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { useQuery } from '@apollo/client/react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import Hero from '../components/sections/Hero';
import ProductsGrid, { type FeaturedProduct } from '../components/sections/ProductsGrid';
import HomeBanners from '../components/sections/HomeBanners';
import BlogGrid, { type BlogGridItem } from '../components/sections/BlogGrid';
import { FEATURED_PRODUCTS_MOCK } from '../utils/mockProducts';
import client from '../lib/graphql/apolloClient';
import { GET_PRODUCTS, GET_BLOG_POSTS } from '../lib/graphql/queries';
import { pickImage } from '../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../utils/html';
import { fetchWooProductsREST } from '../lib/api/woocommerce';
// WordPress/GraphQL supplies product data; remove Printful fallback

type ProductFromApi = {
  id: string;
  name: string;
  slug?: string;
  price?: string | number | null;
  regularPrice?: string | number | null;
  shortDescription?: string | null;
  image?: { sourceUrl?: string | null } | null;
};

type GetProductsData = {
  products?: { nodes?: ProductFromApi[] };
};

type GetProductsVars = { first?: number };

type PageProps = {
  hero: null;
  blogItems: BlogGridItem[];
  products: FeaturedProduct[];
};

type GetBlogPostsData = {
  posts?: { nodes?: any[] };
};

export default function Home({ hero, blogItems, products: productsSSR }: PageProps) {
  // Always query WPGraphQL for products; apolloClient has a default endpoint.
  const skipQuery = false;
  const { data, loading, error } = useQuery<GetProductsData, GetProductsVars>(GET_PRODUCTS, {
    variables: { first: 12 },
    skip: skipQuery,
  });
  // Prefer client data; fallback to SSR props; finally mock
  const products = data?.products?.nodes ?? productsSSR ?? [];
  // Removed Printful fallback: rely on GraphQL (WPGraphQL) or mock data.
  const FEATURED_CATEGORY = 'Featured Products';
  // Choose products for Home: prefer API data (no categories in current query), otherwise mock filtered by Featured category.
  type FeaturedMock = FeaturedProduct & { categories?: string[] };
  const MOCK: FeaturedMock[] = FEATURED_PRODUCTS_MOCK as unknown as FeaturedMock[];
  const displayProducts: FeaturedProduct[] = products.length > 0
    ? (products as FeaturedProduct[]).slice(0, 6)
    : (MOCK.filter((p) => Array.isArray(p.categories) && p.categories!.includes(FEATURED_CATEGORY)).slice(0, 6)
        || MOCK.slice(0, 6));

  return (
    <Fragment>
      <Head>
        <title>Shamanicca — Shop & Audio</title>
        <meta name="description" content="Digital audio and merch" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <Hero />
          

          {/* Featured Products section (API or mock JSON fallback) */}
          <ProductsGrid products={displayProducts} />


          {/* Banners */}
          <HomeBanners
            banners={[
              {
                id: 'b1',
                title: 'Magic Accessories',
                subtitle: 'Altar pads, Mose pads, collars, Printed art',
                href: '/shop/accessories',
                imageUrl: 'https://placehold.co/1000x800.png?text=Img1',
              },
              {
                id: 'b2',
                title: 'Manifestation Audibles',
                subtitle: 'Guides Meditations, Subliminal audios',
                href: '/shop/audios',
                imageUrl: 'https://placehold.co/1000x800.png?text=Img2',
              },
            ]}
          />

          

          {/* Blog Articles (from WordPress) */}
          <BlogGrid
            title="Blog Articles"
            items={blogItems}
            ctaHref="/blog"
            ctaLabel="Check Shamanicca’s Blog Posts"
          />

          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    // Fetch products server-side so Home has initial data
    let productsSSR: FeaturedProduct[] = [];
    try {
      const productsResp = await client.query<GetProductsData, GetProductsVars>({ query: GET_PRODUCTS, variables: { first: 12 } });
      productsSSR = (productsResp.data.products?.nodes ?? []) as unknown as FeaturedProduct[];
    } catch {
      productsSSR = [];
    }
    // If GraphQL doesn't expose products, fallback to Woo REST when configured
    if (!productsSSR || productsSSR.length === 0) {
      try {
        const restProducts = await fetchWooProductsREST(12);
        productsSSR = restProducts;
      } catch {
        // ignore
      }
    }
    const { data } = await client.query<GetBlogPostsData>({ query: GET_BLOG_POSTS, variables: { first: 4 } });
    const blogItems: BlogGridItem[] = (data.posts?.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));
    return { props: { hero: null, blogItems, products: productsSSR }, revalidate: 300 };
  } catch {
    return { props: { hero: null, blogItems: [], products: [] }, revalidate: 60 };
  }
};
