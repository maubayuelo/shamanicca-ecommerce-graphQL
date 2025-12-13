import React from 'react';
import Image from 'next/image';

import type { BlogGridItem } from './BlogGrid';

type SidebarSection = {
  title: string;
  items: BlogGridItem[];
};

type SidebarBanner = {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
};

type BlogSidebarProps = {
  sections?: SidebarSection[];
  banners?: SidebarBanner[];
  className?: string;
};

export default function BlogSidebar({ sections = [], banners = [], className = '' }: BlogSidebarProps) {
  return (
    <aside className={`blog-sidebar ${className}`}>
      {sections.map((section, idx) => (
        <div key={`sec-${idx}`} className="blog-sidebar__section">
          <h3 className="type-3xl type-extrabold mt-0 mb-xs-responsive">{section.title}</h3>
          <div className="blog-sidebar__list">
            {section.items.map((item) => (
              <article key={item.id} className="blog-sidebar__row">
                <a href={item.href || '#'} className="blog-sidebar__thumb" aria-label={`Read ${item.title}`}>
                  <Image src={item.imageUrl || 'https://placehold.co/180x180.png'} alt="" width={180} height={180} loading="lazy" />
                </a>
                <div className="blog-sidebar__info">
                  <h3 className="type-2xl type-extrabold m-0"><a href={item.href || '#'}>{item.title}</a></h3>
                  {item.summary && <p className="type-md m-0">{item.summary}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}

      {banners.map((b, idx) => (
        <a key={`bnr-${idx}`} href={b.href || '#'} className="blog-sidebar__banner">
          <div className="blog-sidebar__banner-image">
            <Image src={b.imageUrl} alt={b.title || ''} width={180} height={180} />
          </div>
          <div className="blog-sidebar__banner-body">
            <div className="flex flex-col gap-[3px]">
              {b.title && <div className="type-xl type-extrabold">{b.title}</div>}
              {b.subtitle && <div className="type-md">{b.subtitle}</div>}
            </div>
            {b.ctaLabel && (
              <div className="btn btn-primary btn-large self-stretch">{b.ctaLabel}</div>
            )}
          </div>
        </a>
      ))}
    </aside>
  );
}
