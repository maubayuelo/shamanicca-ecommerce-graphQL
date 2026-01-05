import React from 'react';
import Image from 'next/image';

export type BlogGridItem = {
  id: string | number;
  title: string;
  summary?: string;
  imageUrl?: string;
  href?: string;
};

export type BlogGridProps = {
  items: BlogGridItem[];
  className?: string;
  title?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function BlogGrid({
  items,
  className = '',
  title,
  ctaHref,
  ctaLabel,
}: BlogGridProps) {
  return (
     <div className="main">
      <section className={`blog-grid ${className}`}>
      {title && (
        <h2 className="blog-grid__title type-4xl type-extrabold mt-lg-responsive mb-md-responsive">{title}</h2>
      )}

      <div className="blog-grid__list">
        {items.map((item) => (
          <BlogGridCard key={item.id} item={item} />
        ))}
      </div>

      {ctaHref && ctaLabel && (
        <div className="blog-grid__footer mt-lg-responsive mb-lg-responsive">
          <a href={ctaHref} className="btn btn-secondary btn-large">{ctaLabel}</a>
        </div>
      )}
      </section>
    </div>
    
  );
}

function BlogGridCard({ item }: { item: BlogGridItem }) {
  const img = item.imageUrl || 'https://placehold.co/345x230.png';
  const summaryText = item.summary ? (item.summary.length > 57 ? item.summary.slice(0, 56).trimEnd() + '…' : item.summary) : undefined;
  return (
    <article className="blog-grid__item">
      <a href={item.href || '#'} className="blog-grid__thumb rounded-30" aria-label={`Read ${item.title}`}>
        <Image src={img} alt="" width={345} height={230} loading="lazy" />
      </a>
      <div className="blog-grid__info">
        <h3 className="type-xl type-extrabold m-0"><a href={item.href || '#'}>{item.title}</a></h3>
        {summaryText && <p className="type-md m-0">{summaryText}</p>}
      </div>
    </article>
  );
}
