import React from 'react';
import Image from 'next/image';

export type BlogGridItem = {
  id: string | number;
  title: string;
  summary?: string;
  imageUrl?: string | null;
  imageUrlMedium?: string | null;
  imageUrlLarge?: string | null;
  href?: string;
};

export type BlogGridProps = {
  items: BlogGridItem[];
  className?: string;
  title?: string;
  ctaHref?: string;
  ctaLabel?: string;
  emptyMessage?: string;
};

export default function BlogGrid({
  items,
  className = '',
  title,
  ctaHref,
  ctaLabel,
  emptyMessage,
}: BlogGridProps) {
  return (
     <section className={`flex flex-col ${className}`}>
      {title && (
        <h2 className="type-4xl type-extrabold mt-lg-responsive mb-md-responsive text-black">{title}</h2>
      )}

      {items.length === 0 && emptyMessage ? (
        <p className="type-md">{emptyMessage}</p>
      ) : (
      <div className="grid grid-cols-[1fr] gap-7.5 sm:grid-cols-[repeat(2,1fr)] xl:gap-legacy-45">
        {items.map((item) => (
          <BlogGridCard key={item.id} item={item} />
        ))}
      </div>
      )}

      {ctaHref && ctaLabel && (
        <div className="mt-lg-responsive mb-xl-responsive flex justify-center items-center">
          <a href={ctaHref} className="btn btn-secondary btn-large">{ctaLabel}</a>
        </div>
      )}
      </section>
    
  );
}

function BlogGridCard({ item }: { item: BlogGridItem }) {
  const img = item.imageUrlMedium || item.imageUrl || 'https://placehold.co/350x233.png';
  const summaryText = item.summary ? (item.summary.length > 57 ? item.summary.slice(0, 56).trimEnd() + '…' : item.summary) : undefined;
  return (
    <article className="flex flex-col gap-legacy-15 sm:flex-row">
      <a href={item.href || '#'} className="relative block w-full max-w-full h-57.5 rounded-[15px] overflow-hidden shrink-0 sm:w-37.5 sm:h-37.5" aria-label={`Read ${item.title}`}>
        <Image className="block w-full h-full object-cover rounded-[inherit]" src={img} alt="" width={350} height={233} loading="lazy" sizes="(max-width: 600px) 100vw, 150px" />
      </a>
      <div className="flex flex-col gap-2.5 text-black">
        <h3 className="type-xl type-extrabold m-0"><a href={item.href || '#'} className="text-inherit no-underline transition-[color] duration-200 ease-[ease-in-out] hover:text-primary-500 focus-visible:text-primary-500">{item.title}</a></h3>
        {summaryText && <p className="type-md m-0">{summaryText}</p>}
      </div>
    </article>
  );
}
