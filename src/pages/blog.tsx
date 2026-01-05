import { Fragment } from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import BlogMainPage from '../components/sections/BlogMainPage';
import type { BlogGridItem } from '../components/sections/BlogGrid';
import client from '../lib/graphql/apolloClient';
import { GET_BLOG_POSTS, GET_CATEGORIES } from '../lib/graphql/queries';
import { pickImage } from '../lib/graphql/utils';
type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent: number;
  count: number;
};
import { cleanExcerpt, decodeEntities } from '../utils/html';

type PageProps = {
  posts: BlogGridItem[];
  categories: BlogCategory[];
};

export default function BlogPage({ posts }: PageProps) {
  
  return (
    <Fragment>
      <Head>
        <title>Blog — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <BlogMainPage posts={posts} />
          <Footer />
        </main>
      </div>
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    const [postsRes, catsRes] = await Promise.all([
      client.query({ query: GET_BLOG_POSTS, variables: { first: 15 } }),
      client.query({ query: GET_CATEGORIES, variables: { first: 100 } }),
    ]);

    const posts: BlogGridItem[] = (postsRes.data.posts.nodes || []).map((n: any) => ({
      id: n.databaseId,
      title: decodeEntities(n.title || ''),
      summary: cleanExcerpt(n.excerpt || ''),
      imageUrl: pickImage(n, 'medium') || null,
      href: `/blog/${n.slug}`,
    }));

    const categories: BlogCategory[] = (catsRes.data.categories.nodes || []).map((c: any) => ({
      id: c.databaseId,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      parent: c.parentDatabaseId || 0,
      count: c.count || 0,
    }));

    return {
      props: { posts, categories },
      revalidate: 300,
    };
  } catch {
    return { props: { posts: [], categories: [] }, revalidate: 60 };
  }
};
