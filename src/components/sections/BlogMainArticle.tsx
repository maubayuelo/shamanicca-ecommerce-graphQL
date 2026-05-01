import React from 'react';
import type { BlogGridItem } from './BlogGrid';

export type BlogMainArticleProps = {
  item: BlogGridItem;
  className?: string;
};

export default function BlogMainArticle({ item, className = '' }: BlogMainArticleProps) {
  const mediumSrc = item.imageUrlMedium || item.imageUrl || 'https://placehold.co/350x233.png';
  const largeSrc = item.imageUrlLarge || mediumSrc;

  return (
    <section className={`blog-main-article mb-lg-responsive ${className}`}>
      <a href={item.href || '#'} className="blog-main-article__thumb" aria-label={`Read ${item.title}`}>
        <picture>
          <source media="(min-width: 1024px)" srcSet={largeSrc} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediumSrc} alt="" />
        </picture>
      </a>
      <div className="blog-main-article__body">
        <h1 className="type-2xl type-extrabold m-0">
          <a href={item.href || '#'}>{item.title}</a>
        </h1>
        {item.summary && <p className="type-md m-0">{item.summary}</p>}
      </div>
    </section>
  );
}
