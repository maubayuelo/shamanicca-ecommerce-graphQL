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
    <section className={`blog-main-article mb-lg-responsive flex flex-col gap-legacy-15 lg:flex-row lg:gap-7.5 ${className}`}>
      <a href={item.href || '#'} className="blog-main-article__thumb w-full h-67.5 overflow-hidden relative lg:h-82.5 lg:w-3/5 lg:shrink-0" aria-label={`Read ${item.title}`}>
        <picture>
          <source media="(min-width: 1024px)" srcSet={largeSrc} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="w-full h-full object-cover block" src={mediumSrc} alt="" />
        </picture>
      </a>
      <div className="blog-main-article__body flex flex-col gap-legacy-15 lg:w-2/5">
        <h1 className="type-2xl type-extrabold m-0">
          <a href={item.href || '#'} className="text-inherit no-underline transition-[color] duration-200 ease-[ease-in-out] [&:hover]:text-[#675dff] [&:focus-visible]:text-[#675dff]">{item.title}</a>
        </h1>
        {item.summary && <p className="type-md m-0">{item.summary}</p>}
      </div>
    </section>
  );
}
