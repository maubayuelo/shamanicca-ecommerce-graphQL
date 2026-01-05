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
import { gql } from '@apollo/client';
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
    { title: 'Discover More', items: items.slice(3, 6) },
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
              <BlogSidebar sections={sidebarSections} banners={[]} />
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
    const { data } = await client.query({
      query: GET_ALL_POSTS_WITH_TOTAL,
      variables: { size: PAGE_SIZE, offset },
    });

    const items: BlogGridItem[] = (data.posts?.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));

    const totalItems = data.posts?.pageInfo?.offsetPagination?.total ?? items.length;
    return { props: { items, currentPage, totalItems } };
  } catch {
    // Cursor-based: iterate to the requested page
    let after: string | undefined = undefined;
    for (let i = 1; i < currentPage; i++) {
      const pageRes = await client.query({ query: GET_ALL_POSTS_CURSOR, variables: { first: PAGE_SIZE, after } });
      after = pageRes.data.posts?.pageInfo?.endCursor;
      const hasNext = pageRes.data.posts?.pageInfo?.hasNextPage;
      if (!hasNext && i < currentPage) {
        // Requested page exceeds available pages; return last available page
        break;
      }
    }
    const { data } = await client.query({ query: GET_ALL_POSTS_CURSOR, variables: { first: PAGE_SIZE, after } });
    const items: BlogGridItem[] = (data.posts?.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));
    // Without total support, approximate: if there's a next page, assume more items, otherwise end here
    const hasNext = data.posts?.pageInfo?.hasNextPage ?? false;
    const totalItems = hasNext ? (currentPage + 1) * PAGE_SIZE : (currentPage - 1) * PAGE_SIZE + items.length;
    return { props: { items, currentPage, totalItems } };
  }
};
