import { Fragment } from 'react';
import type { GetStaticProps } from 'next';
import SeoHead from '../components/atoms/SeoHead';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import BlogMainPage from '../components/sections/BlogMainPage';
import type { BlogGridItem } from '../components/sections/BlogGrid';
import client from '../lib/graphql/apolloClient';
import { GET_BLOG_POSTS, GET_CATEGORIES, GET_CATEGORY_POSTS_CURSOR } from '../lib/graphql/queries';
import { pickImage } from '../lib/graphql/utils';
import { cleanExcerpt, decodeEntities } from '../utils/html';

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent: number;
  count: number;
};

type PageProps = {
  posts: BlogGridItem[];
  categories: BlogCategory[];
  topReads: BlogGridItem[];
  magicalPractices: BlogGridItem[];
};

export default function BlogPage({ posts, topReads, magicalPractices }: PageProps) {
  return (
    <Fragment>
      <SeoHead
        title="Journal — Shamanicca"
        description="Explore the Shamanicca journal — articles on mindfulness, shamanism, intentional living, and sacred style."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/blog`}
        ogType="website"
      />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <BlogMainPage posts={posts} topReads={topReads} magicalPractices={magicalPractices} />
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const mapPost = (n: any): BlogGridItem => ({
    id: n.databaseId,
    title: decodeEntities(n.title || ''),
    summary: cleanExcerpt(n.excerpt || ''),
    imageUrl: pickImage(n, 'thumbnail') || null,
    imageUrlMedium: pickImage(n, 'medium') || null,
    imageUrlLarge: pickImage(n, 'large') || null,
    href: `/blog/${n.slug}`,
  });

  // Main posts + categories (page fails if these error)
  let posts: BlogGridItem[] = [];
  let categories: BlogCategory[] = [];
  try {
    const [postsRes, catsRes] = await Promise.all([
      client.query<{ posts: { nodes: any[] } }>({ query: GET_BLOG_POSTS, variables: { first: 15 } }),
      client.query<{ categories: { nodes: any[] } }>({ query: GET_CATEGORIES, variables: { first: 100 } }),
    ]);
    posts = (postsRes.data.posts.nodes || []).map(mapPost);
    categories = (catsRes.data.categories.nodes || []).map((c: any) => ({
      id: c.databaseId,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      parent: c.parentDatabaseId || 0,
      count: c.count || 0,
    }));
  } catch (err) {
    console.error('[blog] main posts error:', err);
    return { props: { posts: [], categories: [], topReads: [], magicalPractices: [] }, revalidate: 60 };
  }

  // Sidebar category posts (isolated — failures leave sidebar empty)
  type CursorData = { category: { posts: { nodes: any[] } } };
  let topReads: BlogGridItem[] = [];
  let magicalPractices: BlogGridItem[] = [];
  try {
    const [topReadsRes, magicalRes] = await Promise.all([
      client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'top-reads', first: 3 }, fetchPolicy: 'no-cache' }),
      client.query<CursorData>({ query: GET_CATEGORY_POSTS_CURSOR, variables: { slug: 'magical-practices', first: 3 }, fetchPolicy: 'no-cache' }),
    ]);
    topReads = (topReadsRes.data.category?.posts?.nodes || []).map(mapPost);
    magicalPractices = (magicalRes.data.category?.posts?.nodes || []).map(mapPost);
    console.log('[blog] topReads:', topReads.map(p => p.title));
    console.log('[blog] magicalPractices:', magicalPractices.map(p => p.title));
  } catch (err) {
    console.error('[blog] sidebar category error:', err);
  }

  return {
    props: { posts, categories, topReads, magicalPractices },
    revalidate: 300,
  };
};
