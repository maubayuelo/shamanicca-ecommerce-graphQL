import React from 'react';
import Breadcrumb from '../molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from './BlogGrid';

type BlogCategoryPageProps = {
  category: string;
  posts: BlogGridItem[];
};

export default function BlogCategoryPage({ category, posts }: BlogCategoryPageProps) {
  return (
    <div className="main">
      <div className="w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: category },
          ]}
        />

        <h1 className="type-4xl type-extrabold mb-30">{category}</h1>
        <BlogGrid items={posts} />
      </div>
    </div>
  );
}
