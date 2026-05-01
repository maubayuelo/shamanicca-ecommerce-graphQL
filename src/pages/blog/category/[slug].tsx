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
import { GET_CATEGORY_BY_SLUG, GET_POSTS_BY_CATEGORY_ID_WITH_TOTAL, GET_CATEGORY_POSTS_CURSOR } from '../../../lib/graphql/queries';
import { pickImage } from '../../../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../../../utils/html';

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
    const pageParam = typeof ctx.query.page === 'string' ? parseInt(ctx.query.page, 10) : NaN;
    const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const offset = (currentPage - 1) * PAGE_SIZE;

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
      const catRes = await client.query<{ category: { name: string; description: string; count: number; databaseId: number } }>({ query: GET_CATEGORY_BY_SLUG, variables: { slug } });
      const cat = catRes.data.category;
      if (!cat) return { notFound: true };

      type CursorPageData = { category: { posts: { nodes: any[]; pageInfo: { endCursor: string; hasNextPage: boolean } } } };
      // Walk pages to requested page using cursors
      let after: string | undefined = undefined;
      if (currentPage > 1) {
        const head = await client.query<CursorPageData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
        after = head.data.category?.posts?.pageInfo?.endCursor;
        for (let i = 2; i < currentPage; i++) {
          const pageRes = await client.query<CursorPageData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
          after = pageRes.data.category?.posts?.pageInfo?.endCursor;
          const hasNext = pageRes.data.category?.posts?.pageInfo?.hasNextPage;
          if (!hasNext) break;
        }
      }

      const { data } = await client.query<CursorPageData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug, first: PAGE_SIZE, after } });
      const catNode = data.category;
      if (!catNode) return { notFound: true };
      const items: BlogGridItem[] = (catNode.posts?.nodes || []).map((n: any) => ({
        id: n.databaseId,
        title: decodeEntities(n.title || ''),
        summary: cleanExcerpt(n.excerpt || ''),
        imageUrl: pickImage(n, 'thumbnail') || null,
        imageUrlMedium: pickImage(n, 'medium') || null,
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
          topReads,
          magicalPractices,
          categoryId: cat.databaseId,
        },
      };
    } catch {
      // Last resort: try taxQuery with includeChildren
      try {
        const catRes = await client.query<{ category: { name: string; description: string; count: number; databaseId: number } }>({ query: GET_CATEGORY_BY_SLUG, variables: { slug } });
        const cat = catRes.data.category;
        if (!cat) return { notFound: true };
        const taxRes = await client.query<{ posts: { nodes: any[]; pageInfo: { offsetPagination: { total: number } } } }>({
          query: GET_POSTS_BY_CATEGORY_ID_WITH_TOTAL,
          variables: { categoryId: [cat.databaseId], size: PAGE_SIZE, offset },
        });
        const items: BlogGridItem[] = (taxRes.data.posts?.nodes || []).map((n: any) => ({
          id: n.databaseId,
          title: decodeEntities(n.title || ''),
          summary: cleanExcerpt(n.excerpt || ''),
          imageUrl: pickImage(n, 'thumbnail') || null,
          imageUrlMedium: pickImage(n, 'medium') || null,
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
            topReads,
            magicalPractices,
            categoryId: cat.databaseId,
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
