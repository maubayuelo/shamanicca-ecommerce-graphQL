import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/organisms/Header';
import Footer from '../../components/organisms/Footer';
import Image from 'next/image';
import Breadcrumb from '../../components/molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from '../../components/sections/BlogGrid';
import BlogSidebar from '../../components/sections/BlogSidebar';
import { getAllPosts, getPostBySlug, getPostsByCategory, type BlogPost } from '../../utils/blogPosts';

type PageProps = {
  post: BlogPost;
  relatedPosts: BlogGridItem[];
  sidebarSections: { title: string; items: BlogGridItem[] }[];
};

export default function BlogPostPage({ post, relatedPosts, sidebarSections }: PageProps) {
  const banners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
    },
  ];

  return (
    <>
      <Head>
        <title>{post.title} — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />

          <div className="main">
            <div className="blog-layout mt-lg-responsive">
              <div className="blog-content">
                <Breadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Blog', href: '/blog' },
                    { label: post.title },
                  ]}
                />

                <h1 className="type-4xl type-extrabold mb-10">{post.title}</h1>
                {post.category && (
                  <div className="type-sm mb-15">
                    Category: <a href={`/blog/category/${encodeURIComponent(post.category)}`}>{post.category}</a>
                  </div>
                )}

                <article className="mb-60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {post.imageUrl && (
                    <Image
                      src={post.imageUrl}
                      alt=""
                      width={915}
                      height={531}
                      className="mb-15 rounded-30"
                      sizes="(min-width: 1280px) 915px, 100vw"
                      style={{ width: '100%', height: 'auto' }}
                      priority={false}
                    />
                  )}
                  {post.content && (
                    <p className="type-paragraph type-medium type-gray-90">{post.content}</p>
                    
                  )}
                </article>

                {relatedPosts.length > 0 && (
                  <BlogGrid title="Related Posts" items={relatedPosts} />
                )}
              </div>

              <BlogSidebar sections={sidebarSections} banners={banners} />
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();
  const paths = posts
    .map((p) => p.href?.split('/').pop())
    .filter((s): s is string => Boolean(s))
    .map((slug) => ({ params: { slug } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async (ctx) => {
  const slug = ctx.params?.slug as string;
  const post = getPostBySlug(slug);

  if (!post) {
    return { notFound: true };
  }

  const sameCategory = post.category ? getPostsByCategory(post.category) : [];
  const relatedPosts = (sameCategory.length > 0 ? sameCategory : getAllPosts())
    .filter((p) => p.href !== post.href)
    .slice(0, 6);

  const others = getAllPosts().filter((p) => p.href !== post.href);
  const sidebarSections = [
    { title: 'Top Reads', items: others.slice(0, 3) },
    { title: 'Discover More', items: others.slice(3, 6) },
  ];

  return {
    props: {
      post,
      relatedPosts,
      sidebarSections,
    },
  };
};
