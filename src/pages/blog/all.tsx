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
 * PAGINATION (ids paging, see utils/paginate.ts):
 *  WordPress keeps a curated post order that `orderby` does not change, while
 *  WPGraphQL cursors filter by date — walking cursors repeated posts on every
 *  page. So one query (GET_POST_IDS) lists every post id in the site's own
 *  order, the page's slice of ids is cut here, and a second query
 *  (GET_POSTS_BY_IDS) loads exactly those posts, in that order. The total is
 *  the id count, so the paginator always shows every page.
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
import { GET_POST_IDS, GET_POSTS_BY_IDS } from '../../lib/graphql/queries';
import { pickImage } from '../../lib/graphql/utils';
import { useBanners } from '../../hooks/useBanners';
import { cleanExcerpt, decodeEntities } from '../../utils/html';
import { MAX_LISTING_IDS, paginateIds, parsePageParam, warnIfTruncated } from '../../utils/paginate';

const PAGE_SIZE = 9;

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

  const { banner } = useBanners(null);

  const sidebarBanners = banner ? [{
    imageUrl: banner.banner_image,
    title: banner.banner_headline,
    subtitle: banner.banner_subtext,
    ctaLabel: banner.banner_cta_label,
    href: banner.banner_cta_url,
    isAffilliated: banner.banner_type === 'affiliate',
  }] : [];

  const hrefBuilder = (page: number) => {
    const base = '/blog/all';
    return page === 1 ? base : `${base}?page=${page}`;
  };

  return (
    <Fragment>
      <Head>
        <title>All Posts — Shamanicca</title>
      </Head>
      <div>
        <main>
          <Header />
          <div className="main">
            <div className="blog-layout block xl:grid xl:grid-cols-[1fr_450px] xl:gap-15 mt-lg-responsive">
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
              <BlogSidebar sections={sidebarSections} banners={sidebarBanners} />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const currentPage = parsePageParam(ctx.query.page);

  const idsRes = await client.query<{ posts: { nodes: Array<{ databaseId: number }> } }>({
    query: GET_POST_IDS,
    variables: { first: MAX_LISTING_IDS },
    fetchPolicy: 'no-cache',
  });
  const ids = (idsRes.data.posts?.nodes || []).map((n) => n.databaseId);
  warnIfTruncated(ids.length, '/blog/all');

  const { pageIds } = paginateIds(ids, currentPage, PAGE_SIZE);

  let items: BlogGridItem[] = [];
  if (pageIds.length > 0) {
    const { data } = await client.query<{ posts: { nodes: any[] } }>({
      query: GET_POSTS_BY_IDS,
      variables: { in: pageIds.map(String), first: PAGE_SIZE },
      fetchPolicy: 'no-cache',
    });
    const byId = new Map<number, any>((data.posts?.nodes || []).map((n: any) => [n.databaseId, n]));
    items = pageIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((n: any) => ({
        id: n.databaseId,
        title: decodeEntities(n.title || ''),
        summary: cleanExcerpt(n.excerpt || ''),
        imageUrl: pickImage(n, 'thumbnail') || null,
        imageUrlMedium: pickImage(n, 'medium') || null,
        href: `/blog/${n.slug}`,
      }));
  }

  return { props: { items, currentPage, totalItems: ids.length } };
};
