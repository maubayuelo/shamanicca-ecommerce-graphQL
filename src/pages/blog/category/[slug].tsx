import { Fragment } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Header from '../../../components/organisms/Header';
import Footer from '../../../components/organisms/Footer';
import BlogHeader from '../../../components/sections/BlogHeader';
import BlogGrid, { type BlogGridItem } from '../../../components/sections/BlogGrid';
import BlogBanner from '../../../components/sections/BlogBanner';
import BlogSidebar from '../../../components/sections/BlogSidebar';
import Paginator from '../../../components/molecules/Paginator';
import client from '../../../lib/graphql/apolloClient';
import { GET_CATEGORY_BY_SLUG, GET_CHILD_CATEGORIES, GET_POSTS_BY_CATEGORY_ID_WITH_TOTAL, GET_CATEGORY_POSTS_CURSOR } from '../../../lib/graphql/queries';
import { pickImage } from '../../../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../../../utils/html';

const PAGE_SIZE = 9; // paginator every 9 posts

type PageProps = {
  slug: string;
  name: string;
  description: string;
  items: BlogGridItem[];
  currentPage: number;
  totalItems: number;
};

export default function BlogCategoryPage({ slug, name, description, items, currentPage, totalItems }: PageProps) {

  // Page slice
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = items.slice(start, end);

  // Interleave banner after every 6 items within the page
  const firstBlock = pageItems.slice(0, 6);
  const secondBlock = pageItems.slice(6);

  const subtitleText = (() => {
    const s = cleanExcerpt(description);
    return s; // do not truncate subtitle
  })();

  const hrefBuilder = (page: number) => {
    const base = `/blog/category/${encodeURIComponent(slug)}`;
    return page === 1 ? base : `${base}?page=${page}`;
  };

  const sampleBanners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
    },
  ];

  const sidebarSections = [
    { title: 'Top Reads', items: items.slice(0, 3) },
    { title: 'Mystic Tools', items: items.slice(3, 6) },
  ];

  return (
    <Fragment>
      <Head>
        <title>{name ? `${decodeEntities(name)} — Blog` : 'Blog Category'} — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <div className="main">
            <div className="blog-layout mt-lg-responsive mb-xl-responsive">
              <div className="blog-content">
                <BlogHeader title={name ? decodeEntities(name) : 'Blog Category'} subtitle={subtitleText} className="mb-lg-responsive" />

                {/* Block 1 */}
                {firstBlock.length > 0 && (
                  <BlogGrid items={firstBlock} className="mb-lg-responsive" />
                )}

                {/* Banner after 6 items */}
                <BlogBanner
                  title="Intentioned Apparel"
                  subtitle="Wear your protection. Embody your abundance."
                  ctaLabel="SHOP NOW!"
                  href="/shop/apparel"
                  imageUrl="https://placehold.co/270x180"
                  className="mb-lg-responsive"
                />

                {/* Block 2 (remaining up to 9 per page) */}
                {secondBlock.length > 0 && (
                  <BlogGrid items={secondBlock} className="mb-lg-responsive" />
                )}

                {/* Paginator */}
                <Paginator
                  className="mt-lg-responsive"
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  hrefBuilder={hrefBuilder}
                />
              </div>

              <BlogSidebar sections={sidebarSections} banners={sampleBanners} />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const slug = ctx.params?.slug ? String(ctx.params.slug) : '';
    const pageParam = typeof ctx.query.page === 'string' ? parseInt(ctx.query.page, 10) : NaN;
    const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const offset = (currentPage - 1) * PAGE_SIZE;

    try {
      // Prefer cursor-based category.posts which we verified returns items on the SiteGround endpoint
      const catRes = await client.query({ query: GET_CATEGORY_BY_SLUG, variables: { slug } });
      const cat = catRes.data.category;
      if (!cat) return { notFound: true };

      // Walk pages to the requested page using cursors
      let after: string | undefined = undefined;
      if (currentPage > 1) {
        // fetch head to initialize cursor
        const head = await client.query({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
        after = head.data.category?.posts?.pageInfo?.endCursor;
        for (let i = 2; i < currentPage; i++) {
          const pageRes = await client.query({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
          after = pageRes.data.category?.posts?.pageInfo?.endCursor;
          const hasNext = pageRes.data.category?.posts?.pageInfo?.hasNextPage;
          if (!hasNext) break;
        }
      }

      const { data } = await client.query({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
      const catNode = data.category;
      if (!catNode) return { notFound: true };
      const items: BlogGridItem[] = (catNode.posts?.nodes || []).map((n: any) => ({
        id: n.databaseId,
        title: decodeEntities(n.title || ''),
        summary: cleanExcerpt(n.excerpt || ''),
        imageUrl: pickImage(n, 'medium') || null,
        href: `/blog/${n.slug}`,
      }));

      return {
        props: {
          slug,
          name: cat.name,
          description: cat.description || '',
          items,
          currentPage,
          totalItems: Number(cat.count) || items.length || 0,
        },
      };
    } catch {
      // As a last resort, try taxQuery with includeChildren
      try {
        const catRes = await client.query({ query: GET_CATEGORY_BY_SLUG, variables: { slug } });
        const cat = catRes.data.category;
        if (!cat) return { notFound: true };
        const taxRes = await client.query({
          query: GET_POSTS_BY_CATEGORY_ID_WITH_TOTAL,
          variables: { categoryId: [cat.databaseId], size: PAGE_SIZE, offset },
        });
        const items: BlogGridItem[] = (taxRes.data.posts?.nodes || []).map((n: any) => ({
          id: n.databaseId,
          title: decodeEntities(n.title || ''),
          summary: cleanExcerpt(n.excerpt || ''),
          imageUrl: pickImage(n, 'medium') || null,
          href: `/blog/${n.slug}`,
        }));
        return {
          props: {
            slug,
            name: cat.name,
            description: cat.description || '',
            items,
            currentPage,
            totalItems: taxRes.data.posts?.pageInfo?.offsetPagination?.total ?? Number(cat.count) ?? items.length ?? 0,
          },
        };
      } catch {
        return { notFound: true };
      }
    }
  } catch {
    return { notFound: true };
  }
};
