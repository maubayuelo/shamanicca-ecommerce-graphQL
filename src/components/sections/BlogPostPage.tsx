import React from 'react';
import Breadcrumb from '../molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from './BlogGrid';

type BlogPostPageProps = {
  title: string;
  content: React.ReactNode;
  category?: string;
  relatedPosts?: BlogGridItem[];
};

export default function BlogPostPage({ title, content, category, relatedPosts = [] }: BlogPostPageProps) {
  return (
    <div className="main">
      <div className="w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: title },
          ]}
        />

        <h1 className="type-4xl type-extrabold mb-30">{title}</h1>
        {category && (
          <div className="type-sm mb-15">Category: <a href={`/blog/category/${encodeURIComponent(category)}`}>{category}</a></div>
        )}

        <article className="mb-60">
          {content}
        </article>

        <BlogGrid title="Related Posts" items={relatedPosts} emptyMessage="Posts not loaded" />
      </div>
    </div>
  );
}
