import React from 'react';
import Image from 'next/image';
import type { BlogGridItem } from '../sections/BlogGrid';

export type BlogSidebarCardProps = {
  item: BlogGridItem;
};

export default function BlogSidebarCard({ item }: BlogSidebarCardProps) {
  const summaryText = item.summary ? (item.summary.length > 57 ? item.summary.slice(0, 56).trimEnd() + '…' : item.summary) : undefined;
  return (
    <article className="blog-sidebar__row">
      <a href={item.href || '#'} className="blog-sidebar__thumb rounded-30" aria-label={`Read ${item.title}`}>
        <Image src={item.imageUrl || 'https://placehold.co/180x180.png'} alt="" width={180} height={180} loading="lazy" />
      </a>
      <div className="blog-sidebar__info">
        <h3 className="type-xl type-extrabold m-0"><a href={item.href || '#'}>{item.title}</a></h3>
        {summaryText && <p className="type-md m-0">{summaryText}</p>}
      </div>
    </article>
  );
}
