import { Fragment } from 'react';
import SeoHead from '../../components/atoms/SeoHead';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import Image from 'next/image';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from '../../components/sections/BlogGrid';
import BlogSidebar from '../../components/sections/BlogSidebar';
import ArticleShareIcons from '../../components/molecules/ArticleShareIcons';
import InContentBanner from '../../components/sections/InContentBanner';
import { useBanners } from '../../hooks/useBanners';
import client from '../../lib/graphql/apolloClient';
import { GET_POST_BY_SLUG, GET_POST_SLUGS, GET_CATEGORY_POSTS_CURSOR } from '../../lib/graphql/queries';
import { pickImage } from '../../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../../utils/html';

async function fetchAcfBySlug(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const base = (process.env.WORDPRESS_API_URL || 'https://master.shamanicca.com/wp-json').replace(/\/$/, '');
    const url = `${base}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=acf`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length > 0 && arr[0] && typeof arr[0] === 'object') {
      const acf = (arr[0] as any).acf;
      return acf && typeof acf === 'object' ? acf : null;
    }
    return null;
  } catch {
    return null;
  }
}



function extractFeaturedVideoUrl(acf?: Record<string, unknown>): string | undefined {
  if (!acf) return undefined;
  // Respect explicit display toggle when provided
  const displayRaw = acf['display_video'];
  if (typeof displayRaw !== 'undefined') {
    const display = typeof displayRaw === 'boolean'
      ? displayRaw
      : typeof displayRaw === 'string'
        ? ['1', 'true', 'yes', 'on'].includes(displayRaw.toLowerCase())
        : Boolean(displayRaw);
    if (!display) return undefined;
  }

  // Handle YouTube ID fields from ACF
  const idCandidates = ['yoube_video_id', 'youtube_video_id', 'video_id'];
  for (const key of idCandidates) {
    const rawId = acf[key];
    if (typeof rawId === 'string' && rawId.trim().length > 0) {
      const id = rawId.trim();
      return `https://www.youtube.com/embed/${id}`;
    }
  }

  return undefined;
}

function extractFeaturedVideoTitle(acf?: Record<string, unknown>): string | undefined {
  if (!acf) return undefined;
  const title = acf['video_title'];
  return typeof title === 'string' && title.trim().length > 0 ? title.trim() : undefined;
}

type MinimalPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  categories?: number[];
  featuredImage?: string | null;
  _embedded?: any;
  acf?: any;
};

type PageProps = {
  post: MinimalPost;
  relatedPosts: BlogGridItem[];
  sidebarSections: { title: string; items: BlogGridItem[] }[];
  categoryName?: string;
  categorySlug?: string;
  categories?: { name: string; slug: string }[];
};

function splitAtParagraph(html: string, count: number): [string, string] {
  let pos = 0;
  let found = 0;
  while (found < count) {
    const end = html.indexOf('</p>', pos);
    if (end === -1) break;
    pos = end + 4;
    found++;
  }
  return [html.slice(0, pos), html.slice(pos)];
}

export default function BlogPostPage({ post, relatedPosts, sidebarSections, categoryName, categorySlug, categories = [] }: PageProps) {
  const primaryCategoryId = (post.categories as number[] | undefined)?.[0] ?? null;
  const { banner } = useBanners(primaryCategoryId);

  const sidebarBanners = banner ? [{
    imageUrl: banner.banner_image,
    title: banner.banner_headline,
    subtitle: banner.banner_subtext,
    ctaLabel: banner.banner_cta_label,
    href: banner.banner_cta_url,
    isAffilliated: banner.banner_type === 'affiliate',
  }] : [];

  const featuredCaption = (() => {
    const cap = post._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered;
    return cap && cap.trim().length > 0 ? cleanExcerpt(cap) : null;
  })();

  const postTitle = decodeEntities(post.title?.rendered ?? '');
  const postExcerpt = cleanExcerpt(post.excerpt?.rendered ?? '').slice(0, 160);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postTitle,
    description: postExcerpt || undefined,
    image: post.featuredImage ?? undefined,
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'Shamanicca',
      url: siteUrl,
    },
    url: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <Fragment>
      <SeoHead
        title={`${postTitle} — Shamanicca`}
        description={postExcerpt || `Read ${postTitle} on the Shamanicca blog.`}
        canonical={`${siteUrl}/blog/${post.slug}`}
        ogImage={post.featuredImage ?? null}
        ogType="article"
        publishedAt={post.date}
        jsonLd={articleSchema}
      />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />

          <div className="main">
            <div className="blog-layout mt-lg-responsive mb-xl-responsive">
              <div className="blog-content">

                <Breadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Blog', href: '/blog' },
                    ...((categories && categories.length > 0)
                      ? categories
                          .filter(c => c.slug !== 'top-reads')
                          .map(c => ({ label: decodeEntities(c.name), href: `/blog/category/${c.slug}` }))
                      : (categoryName && categorySlug && categorySlug !== 'top-reads'
                          ? [{ label: decodeEntities(categoryName), href: `/blog/category/${categorySlug}` }]
                          : []
                        )
                    ),
                  ]}
                  linkLast={true}
                />

                <h1 className="type-5xl type-extrabold mt-xs-responsive mb-0">{decodeEntities(post.title?.rendered ?? '')}</h1>
                
                {post.excerpt?.rendered && (
                  <p className="type-2xl mt-sm-responsive mb-0">
                    {cleanExcerpt(post.excerpt.rendered)}
                  </p>
                )}

                {(categories && categories.length > 0) ? (
                  <p className="type-sm mt-sm-responsive mb-sm-responsive">
                    Category: <a className='type-bold' href={`/blog/category/${categories[0].slug}`}>{decodeEntities(categories[0].name)}</a>
                  </p>
                ) : (categoryName && categorySlug) ? (
                  <p className="type-sm mt-sm-responsive mb-sm-responsive">
                    Category: <a className='type-bold' href={`/blog/category/${categorySlug}`}>{decodeEntities(categoryName)}</a>
                  </p>
                ) : null}

                <ArticleShareIcons articleTitle={decodeEntities(post.title?.rendered ?? '')} articleUrl={`/blog/${post.slug}`} className="mt-xs-responsive  mb-md-responsive" />

                <article className="post-body">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {post.featuredImage && (
                    <Image
                      src={post.featuredImage}
                      alt=""
                      width={915}
                      height={531}
                      className={`${featuredCaption ? 'mb-xs-responsive' : 'mb-md-responsive'} rounded-30`}
                      sizes="(min-width: 1280px) 915px, 100vw"
                      style={{ width: '100%', height: 'auto' }}
                      priority={false}
                    />
                  )}

                  {featuredCaption && (
                    <p className="type-italic type-sm mt-0 mb-md-responsive">
                      {featuredCaption}
                    </p>
                  )}

                  

                  {(() => {
                    const url = extractFeaturedVideoUrl(post.acf);
                    const title = extractFeaturedVideoTitle(post.acf) ?? 'Post featured video';
                    return url ? (
                      <Fragment>

                        <iframe
                          className="post-video mb-sm-responsive"
                          src={url}
                          title={decodeEntities(title)}
                          frameBorder={0}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />

                        <p className="type-italic type-sm mt-0 mb-md-responsive">
                       {decodeEntities(title)}
                      </p>
                      </Fragment>

                  ) : null;
                  })()}

                  

                  {post.content?.rendered && (() => {
                    const html = post.content.rendered;
                    const [part1, rest] = splitAtParagraph(html, 3);
                    return (
                      <div className="post-content pt-sm-responsive pb-sm-responsive">
                        <div dangerouslySetInnerHTML={{ __html: part1 }} />
                        {banner && <InContentBanner banner={banner} />}
                        <div dangerouslySetInnerHTML={{ __html: rest }} />
                        {banner && <InContentBanner banner={banner} />}
                      </div>
                    );
                  })()}

                </article>

                {relatedPosts.length > 0 ? (
                  <BlogGrid title="Related Posts" className='mb-lg-responsive' items={relatedPosts} emptyMessage="Posts not loaded" />
                ) : (
                  <p className="type-md mb-lg-responsive">Posts not loaded</p>
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

export const getStaticPaths: GetStaticPaths = async () => {
  const res = await client.query<{ posts: { nodes: Array<{ slug: string }> } }>({ query: GET_POST_SLUGS, variables: { first: 50 } });
  const paths = (res.data.posts.nodes || []).map((p) => ({ params: { slug: p.slug } }));
  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<PageProps> = async (ctx) => {
  const slug = ctx.params?.slug as string;
  try {
    const { data } = await client.query<{ postBy: any }>({ query: GET_POST_BY_SLUG, variables: { slug } });
    const postNode = data.postBy;
    if (!postNode) return { notFound: true, revalidate: 60 };

    const toGridItem = (n: any): BlogGridItem => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'thumbnail') || undefined,
      imageUrlMedium: pickImage(n, 'medium') || undefined,
      href: `/blog/${n.slug}`,
    });

    let categoryName: string | undefined;
    let categorySlug: string | undefined;
    const primaryCategory = postNode.categories?.nodes?.[0];
    if (primaryCategory) {
      categoryName = primaryCategory.name;
      categorySlug = primaryCategory.slug;
    }

    type CursorData = { category: { posts: { nodes: any[] } } };

    // Related posts: same category as the current post
    let relatedPosts: BlogGridItem[] = [];
    if (categorySlug) {
      try {
        const res = await client.query<CursorData>({
          query: GET_CATEGORY_POSTS_CURSOR,
          variables: { slug: categorySlug, first: 5 },
          fetchPolicy: 'no-cache',
        });
        relatedPosts = (res.data.category?.posts?.nodes || [])
          .filter((n: any) => n.slug !== slug)
          .map(toGridItem)
          .slice(0, 4);
      } catch { /* stays empty — UI shows "Posts not loaded" */ }
    }

    // Sidebar: always Top Reads + Magical Practices categories
    let topReadsPosts: BlogGridItem[] = [];
    let magicalPracticesPosts: BlogGridItem[] = [];
    try {
      const [topRes, magRes] = await Promise.all([
        client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'top-reads', first: 3 }, fetchPolicy: 'no-cache' }),
        client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'magical-practices', first: 3 }, fetchPolicy: 'no-cache' }),
      ]);
      topReadsPosts = (topRes.data.category?.posts?.nodes || []).map(toGridItem);
      magicalPracticesPosts = (magRes.data.category?.posts?.nodes || []).map(toGridItem);
    } catch { /* sidebar stays empty */ }

    const sidebarSections = [
      { title: 'Top Reads', items: topReadsPosts },
      { title: 'Magical Practices', items: magicalPracticesPosts },
    ];

    const categories = (postNode.categories?.nodes || []).map((c: any) => ({ name: c.name, slug: c.slug }));

    const post: MinimalPost = {
      id: postNode.databaseId,
      slug: postNode.slug,
      date: postNode.date,
      title: { rendered: postNode.title || '' },
      excerpt: { rendered: postNode.excerpt || '' },
      content: { rendered: postNode.content || '' },
      categories: postNode.categories?.nodes?.map((c: any) => c.databaseId) || [],
      featuredImage: pickImage(postNode, 'large') || null,
      _embedded: null,
      acf: null,
    } as any;

    // Fetch ACF via REST (WP JSON) for video fields without breaking GraphQL builds
    const acf = await fetchAcfBySlug(slug);
    if (acf) {
      post.acf = acf;
    }

    return {
      props: {
        post,
        relatedPosts,
        sidebarSections,
        categoryName,
        categorySlug,
        categories,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error(`Error fetching blog post [${slug}]:`, error);
    // Return 404 for non-existent posts from WP backend
    return { notFound: true, revalidate: 60 };
  }
};
