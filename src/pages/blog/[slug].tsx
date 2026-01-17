import { Fragment } from 'react';
import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import Image from 'next/image';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from '../../components/sections/BlogGrid';
import BlogSidebar from '../../components/sections/BlogSidebar';
import BlogBanner from '../../components/sections/BlogBanner';
import ArticleShareIcons from '../../components/molecules/ArticleShareIcons';
import client from '../../lib/graphql/apolloClient';
import { GET_POST_BY_SLUG, GET_BLOG_POSTS, GET_POST_SLUGS, GET_CATEGORIES } from '../../lib/graphql/queries';
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

function extractIframeSrc(html: string): string | undefined {
  const m = html.match(/src=["']([^"']+)["']/i);
  return m ? m[1] : undefined;
}

function toYouTubeEmbed(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/').filter(Boolean)[1];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    }
  } catch {}
  return undefined;
}

function toVimeoEmbed(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return undefined;
}

function normalizeVideoUrl(input: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (trimmed.startsWith('<')) {
    const src = extractIframeSrc(trimmed);
    return src || undefined;
  }
  const yt = toYouTubeEmbed(trimmed);
  if (yt) return yt;
  const vimeo = toVimeoEmbed(trimmed);
  if (vimeo) return vimeo;
  return trimmed;
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
};

export default function BlogPostPage({ post, relatedPosts, sidebarSections, categoryName, categorySlug }: PageProps) {
  const banners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
      isAffilliated: true,
    },
  ];

  const featuredCaption = (() => {
    const cap = post._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered;
    return cap && cap.trim().length > 0 ? cleanExcerpt(cap) : null;
  })();

  return (
    <Fragment>
      <Head>
        <title>{decodeEntities(post.title?.rendered ?? '')} — Shamanicca</title>
      </Head>
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
                    ...(categoryName && categorySlug
                      ? [{ label: decodeEntities(categoryName), href: `/blog/category/${categorySlug}` }]
                      : []),
                  ]}
                />

                <h1 className="type-5xl type-extrabold mt-xs-responsive mb-0">{decodeEntities(post.title?.rendered ?? '')}</h1>
                
                {post.excerpt?.rendered && (
                  <p className="type-2xl mt-sm-responsive mb-0">
                    {cleanExcerpt(post.excerpt.rendered)}
                  </p>
                )}

                {categoryName && categorySlug && (
                  <p className="type-sm mt-sm-responsive mb-sm-responsive">
                    Category: <a className='type-bold' href={`/blog/category/${categorySlug}`}>{decodeEntities(categoryName)}</a>
                  </p>
                )}

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

                  

                  {banners[0] && (
                    <BlogBanner
                        title={banners[0].title}
                        subtitle={banners[0].subtitle}
                        ctaLabel={banners[0].ctaLabel}
                        href={banners[0].href}
                        imageUrl={banners[0].imageUrl}
                        isAffilliated={banners[0].isAffilliated}
                      />
                  )}

                  {post.content?.rendered && (
                    <Fragment>
                    <div className="post-content pt-sm-responsive pb-sm-responsive" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
                    </Fragment>
                  )}

                  {/* Insert banner component here */}
                  {banners[0] && (
                    <div className="my-sm-responsive">
                      <BlogBanner
                        title={banners[0].title}
                        subtitle={banners[0].subtitle}
                        ctaLabel={banners[0].ctaLabel}
                        href={banners[0].href}
                        imageUrl={banners[0].imageUrl}
                        isAffilliated={banners[0].isAffilliated}
                      />
                    </div>
                  )}
                  
                </article>

                {relatedPosts.length > 0 && (
                  <BlogGrid title="Related Posts" className='mb-lg-responsive' items={relatedPosts} />
                )}

                {banners[0] && (
                    <BlogBanner
                        title={banners[0].title}
                        subtitle={banners[0].subtitle}
                        ctaLabel={banners[0].ctaLabel}
                        href={banners[0].href}
                        imageUrl={banners[0].imageUrl}
                        isAffilliated={banners[0].isAffilliated}
                      />
                  )}

              </div>

              <BlogSidebar sections={sidebarSections} banners={banners} />
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const res = await client.query({ query: GET_POST_SLUGS, variables: { first: 50 } });
  const paths = (res.data.posts.nodes || []).map((p: any) => ({ params: { slug: p.slug } }));
  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<PageProps> = async (ctx) => {
  try {
    const slug = ctx.params?.slug as string;
    const { data } = await client.query({ query: GET_POST_BY_SLUG, variables: { slug } });
    const postNode = data.postBy;
    if (!postNode) return { notFound: true, revalidate: 60 };

    const recent = await client.query({ query: GET_BLOG_POSTS, variables: { first: 20 } });

    const toGridItem = (n: any): BlogGridItem => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'medium') || undefined,
      href: `/blog/${n.slug}`,
    });
    const others = (recent.data.posts.nodes || [])
      .filter((n: any) => n.slug !== slug)
      .map(toGridItem);
    const relatedPosts = others.slice(0, 6);
    const sidebarSections = [
      { title: 'Top Reads', items: others.slice(0, 3) },
      { title: 'Discover More', items: others.slice(3, 6) },
    ];

    let categoryName: string | undefined;
    let categorySlug: string | undefined;
    const primaryCategory = postNode.categories?.nodes?.[0];
    if (primaryCategory) {
      categoryName = primaryCategory.name;
      categorySlug = primaryCategory.slug;
    }

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
      },
      revalidate: 300,
    };
  } catch {
    // On error, avoid hard 404; serve a soft fallback so pages don't disappear
    return { notFound: false, props: { post: null as any, relatedPosts: [], sidebarSections: [] }, revalidate: 60 } as any;
  }
};
