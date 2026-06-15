/**
 * blog/all.tsx — Paginated "all posts" listing page (route: /blog/all?page=N)
 *
 * This page lists ALL blog posts with pagination (9 posts per page).
 * Unlike most pages in this app which use getStaticProps (static generation),
 * this page uses getServerSideProps — it is rendered fresh on every request.
 *
 * WHY getServerSideProps HERE INSTEAD OF getStaticProps?
 * The page content depends on the `?page=` query parameter in the URL.
 * With getStaticProps you can only pre-generate specific paths. Since the page
 * number can change (and change often as new posts are added), server-side
 * rendering is simpler here — the server reads the query param and fetches
 * the correct page of results on each request.
 *
 * PAGINATION STRATEGIES:
 * This page tries two approaches in order:
 *
 *  Strategy 1 — Offset Pagination (preferred, requires WPGraphQL Offset Pagination plugin):
 *    GET_ALL_POSTS_WITH_TOTAL uses `offsetPagination: { size, offset }` and returns
 *    a `total` count. This gives us: total items → how many pages → render paginator.
 *    OFFSET_BASE = 10 means the first 10 posts are shown on the homepage/blog landing,
 *    so this listing starts from post #11.
 *
 *  Strategy 2 — Cursor Pagination (fallback, available in WPGraphQL by default):
 *    If the offset plugin isn't installed, cursor-based pagination is used instead.
 *    Cursors are opaque strings (like "YXJyYXljb25uZWN0aW9uOjA=") that point to
 *    a position in the result set. To reach page 3, you must iterate through pages
 *    1 and 2 first (no random access), which is less efficient but always works.
 *    Since we don't have a total count, we estimate it from `hasNextPage`.
 *
 * LAYOUT:
 *  Header → BlogHeader → BlogGrid (9 posts) → Paginator → Footer
 *  + BlogSidebar (sidebar from current page's posts as placeholder)
 */

import { Fragment } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import BlogHeader from '../../components/sections/BlogHeader';
import BlogGrid, { type BlogGridItem } from '../../components/sections/BlogGrid';
import BlogSidebar from '../../components/sections/BlogSidebar';
import Paginator from '../../components/molecules/Paginator';
import client from '../../lib/graphql/apolloClient';
import { GET_ALL_POSTS_WITH_TOTAL, GET_ALL_POSTS_CURSOR } from '../../lib/graphql/queries';
import { pickImage } from '../../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../../utils/html';

const PAGE_SIZE = 9;
const OFFSET_BASE = 10; // Start listing from the 11th post

type PageProps = {
  items: BlogGridItem[];
  currentPage: number;
  totalItems: number;
};

export default function AllPostsPage({ items, currentPage, totalItems }: PageProps) {
  const sidebarSections = [
    { title: 'Top Reads', items: items.slice(0, 3) },
    { title: 'Magical Practices', items: items.slice(3, 6) },
  ];

  const sampleBanners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
    },
  ];

  const hrefBuilder = (page: number) => {
    const base = '/blog/all';
    return page === 1 ? base : `${base}?page=${page}`;
  };

  return (
    <Fragment>
      <Head>
        <title>All Posts — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <div className="main">
            <div className="blog-layout mt-lg-responsive">
              <div className="blog-content">
                <BlogHeader title="All Blog Articles" subtitle="Browse all our posts" className="mb-lg-responsive" />

                <BlogGrid items={items} className="mb-lg-responsive" />

                <Paginator
                  className="mt-lg-responsive mb-xl-responsive"
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
  const pageParam = typeof ctx.query.page === 'string' ? parseInt(ctx.query.page, 10) : NaN;
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const offset = Math.max(0, OFFSET_BASE + (currentPage - 1) * PAGE_SIZE);
  // Prefer offsetPagination if available; otherwise use cursor-based iteration
  try {
    const { data } = await client.query<{ posts: { nodes: any[]; pageInfo: { offsetPagination: { total: number } } } }>({
      query: GET_ALL_POSTS_WITH_TOTAL,
      variables: { size: PAGE_SIZE, offset },
    });

    const items: BlogGridItem[] = (data.posts?.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'thumbnail') || null,
      imageUrlMedium: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));

    const totalItems = data.posts?.pageInfo?.offsetPagination?.total ?? items.length;
    return { props: { items, currentPage, totalItems } };
  } catch {
    // Cursor-based: iterate to the requested page
    let after: string | undefined = undefined;
    for (let i = 1; i < currentPage; i++) {
      const pageRes = await client.query<{ posts: { pageInfo: { endCursor: string; hasNextPage: boolean } } }>({ query: GET_ALL_POSTS_CURSOR, variables: { first: PAGE_SIZE, after } });
      after = pageRes.data.posts?.pageInfo?.endCursor;
      const hasNext = pageRes.data.posts?.pageInfo?.hasNextPage;
      if (!hasNext && i < currentPage) {
        // Requested page exceeds available pages; return last available page
        break;
      }
    }
    const { data } = await client.query<{ posts: { nodes: any[]; pageInfo: { hasNextPage: boolean } } }>({ query: GET_ALL_POSTS_CURSOR, variables: { first: PAGE_SIZE, after } });
    const items: BlogGridItem[] = (data.posts?.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'thumbnail') || null,
      imageUrlMedium: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));
    // Without total support, approximate: if there's a next page, assume more items, otherwise end here
    const hasNext = data.posts?.pageInfo?.hasNextPage ?? false;
    const totalItems = hasNext ? (currentPage + 1) * PAGE_SIZE : (currentPage - 1) * PAGE_SIZE + items.length;
    return { props: { items, currentPage, totalItems } };
  }
};
