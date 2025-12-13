import Head from 'next/head';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import BlogMainPage from '../components/sections/BlogMainPage';
import BlogSidebar from '../components/sections/BlogSidebar';
import type { BlogGridItem } from '../components/sections/BlogGrid';
import { getAllPosts } from '../utils/blogPosts';

export default function BlogPage() {
  
  return (
    <>
      <Head>
        <title>Blog — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <BlogMainPage posts={getAllPosts()} />
          
          <Footer />
        </main>
      </div>
    </>
  );
}
