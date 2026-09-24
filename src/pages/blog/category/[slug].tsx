import { Fragment } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Header from '../../../components/organisms/Header';
import Footer from '../../../components/organisms/Footer';
import BlogHeader from '../../../components/sections/BlogHeader';
import BlogGrid, { type BlogGridItem } from '../../../components/sections/BlogGrid';
import InContentBanner from '../../../components/sections/InContentBanner';
import BlogSidebar from '../../../components/sections/BlogSidebar';
import Paginator from '../../../components/molecules/Paginator';
import { useBanners } from '../../../hooks/useBanners';
import client from '../../../lib/graphql/apolloClient';
import { GET_CATEGORY_POST_IDS, GET_POSTS_BY_IDS, GET_CATEGORY_POSTS_CURSOR } from '../../../lib/graphql/queries';
import { pickImage } from '../../../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../../../utils/html';
import { MAX_LISTING_IDS, paginateIds, parsePageParam, warnIfTruncated } from '../../../utils/paginate';

const PAGE_SIZE = 12;

type PageProps = {
  slug: string;
  name: string;
  description: string;
  items: BlogGridItem[];
  currentPage: number;
  totalItems: number;
  topReads: BlogGridItem[];
  magicalPractices: BlogGridItem[];
  categoryId: number;
};

export default function BlogCategoryPage({ slug, name, description, items, currentPage, totalItems, topReads, magicalPractices, categoryId }: PageProps) {
  const { banner } = useBanners(categoryId);

  // getServerSideProps already returns only the current page's items
  const firstBlock = items.slice(0, 6);
  const secondBlock = items.slice(6);

  const subtitleText = cleanExcerpt(description);

  const hrefBuilder = (page: number) => {
    const base = `/blog/category/${encodeURIComponent(slug)}`;
    return page === 1 ? base : `${base}?page=${page}`;
  };

  const sidebarBanners = banner ? [{
    imageUrl: banner.banner_image,
    title: banner.banner_headline,
    subtitle: banner.banner_subtext,
    ctaLabel: banner.banner_cta_label,
    href: banner.banner_cta_url,
    isAffilliated: banner.banner_type === 'affiliate',
  }] : [];

  const sidebarSections = [
    { title: 'Top Reads', items: topReads },
    { title: 'Magical Practices', items: magicalPractices },
  ];

  return (
    <Fragment>
      <Head>
        <title>{name ? `${decodeEntities(name)} — Blog` : 'Blog Category'} — Shamanicca</title>
      </Head>
      <div>
        <main>
          <Header />
          <div className="main">
            <div className="blog-layout block xl:grid xl:grid-cols-[1fr_450px] xl:gap-15 mt-lg-responsive mb-xl-responsive">
              <div className="blog-content">
                <BlogHeader title={name ? decodeEntities(name) : 'Blog Category'} subtitle={subtitleText} className="mb-lg-responsive" />

                {/* Block 1 */}
                {firstBlock.length > 0 && (
                  <BlogGrid items={firstBlock} className="mb-lg-responsive" />
                )}

                {/* ACF banner after 6 items */}
                {banner && (
                  <InContentBanner banner={banner} />
                )}

                {/* Block 2 (remaining up to 12 per page) */}
                {secondBlock.length > 0 && (
                  <BlogGrid items={secondBlock} className="mb-lg-responsive" />
                )}

                {/* Paginator — only when there is more than one page */}
                {totalItems > PAGE_SIZE && (
                  <Paginator
                    className="mt-lg-responsive"
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={PAGE_SIZE}
                    hrefBuilder={hrefBuilder}
                  />
                )}
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
  try {
    const slug = ctx.params?.slug ? String(ctx.params.slug) : '';
    const currentPage = parsePageParam(ctx.query.page);

    type CursorData = { category: { posts: { nodes: any[] } } };
    const toGridItem = (n: any): BlogGridItem => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'thumbnail') || null,
      imageUrlMedium: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    });

    // Sidebar: always Top Reads + Magical Practices
    let topReads: BlogGridItem[] = [];
    let magicalPractices: BlogGridItem[] = [];
    try {
      const [topRes, magRes] = await Promise.all([
        client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'top-reads', first: 3 }, fetchPolicy: 'no-cache' }),
        client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'magical-practices', first: 3 }, fetchPolicy: 'no-cache' }),
      ]);
      topReads = (topRes.data.category?.posts?.nodes || []).map(toGridItem);
      magicalPractices = (magRes.data.category?.posts?.nodes || []).map(toGridItem);
    } catch { /* sidebar stays empty */ }

    try {
      // One query lists every post id of the category in the site's own order
      // (a category's count is not used: WPGraphQL cursors repeat and skip
      // posts because that order is not by date, see utils/paginate.ts).
      type CategoryIds = { category: { databaseId: number; name: string; description: string; posts: { nodes: Array<{ databaseId: number }> } } | null };
      const idsRes = await client.query<CategoryIds>({
        query: GET_CATEGORY_POST_IDS,
        variables: { slug, first: MAX_LISTING_IDS },
        fetchPolicy: 'no-cache',
      });
      const cat = idsRes.data.category;
      if (!cat) return { notFound: true };
      const ids = (cat.posts?.nodes || []).map((n) => n.databaseId);
      warnIfTruncated(ids.length, `/blog/category/${slug}`);

      const { pageIds } = paginateIds(ids, currentPage, PAGE_SIZE);

      let items: BlogGridItem[] = [];
      if (pageIds.length > 0) {
        const { data } = await client.query<{ posts: { nodes: any[] } }>({
          query: GET_POSTS_BY_IDS,
          variables: { in: pageIds.map(String), first: PAGE_SIZE },
          fetchPolicy: 'no-cache',
        });
        const byId = new Map<number, any>((data.posts?.nodes || []).map((n: any) => [n.databaseId, n]));
        items = pageIds.map((id) => byId.get(id)).filter(Boolean).map((n: any) => toGridItem(n));
      }

      return {
        props: {
          slug,
          name: cat.name,
          description: cat.description || '',
          items,
          currentPage,
          totalItems: ids.length,
          topReads,
          magicalPractices,
          categoryId: cat.databaseId,
        },
      };
    } catch {
      return { notFound: true };
    }
  } catch {
    return { notFound: true };
  }
};
