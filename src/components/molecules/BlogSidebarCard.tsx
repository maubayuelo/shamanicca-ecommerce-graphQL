/**
 * BlogSidebarCard.tsx — Compact post card for the blog sidebar (Molecule)
 *
 * Renders a small horizontal card with a thumbnail and post title.
 * Used in the "Top Reads" and "Magical Practices" sidebar sections
 * on blog listing and individual post pages.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines Image (atom), Link, and text to form a cohesive mini-card.
 *
 * TRUNCATION:
 * The summary text is cut at 57 characters and an ellipsis (…) is added.
 * This keeps all sidebar cards visually consistent in height.
 *
 * FALLBACK IMAGE:
 * If the post has no featured image, a placeholder from placehold.co is used
 * so the layout never breaks from missing images.
 *
 * RECEIVES:
 *  item — a BlogGridItem with id, title, summary, imageUrl, href
 */

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
