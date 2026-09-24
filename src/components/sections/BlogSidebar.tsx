import React from 'react';
import BlogBannerSidebar from './BlogBannerSidebar';
import BlogSidebarCard from '../molecules/BlogSidebarCard';

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
  isAffilliated?: boolean;
};

type BlogSidebarProps = {
  sections?: SidebarSection[];
  banners?: SidebarBanner[];
  className?: string;
};

export default function BlogSidebar({ sections = [], banners = [], className = '' }: BlogSidebarProps) {
  const visibleSections = sections.filter((section) => section.items.length > 0);
  const banner = banners[0] ? (
    <BlogBannerSidebar
      className=""
      imageUrl={banners[0].imageUrl}
      title={banners[0].title}
      subtitle={banners[0].subtitle}
      ctaLabel={banners[0].ctaLabel}
      href={banners[0].href}
      isAffilliated={banners[0].isAffilliated}
    />
  ) : null;

  return (
    <aside className={`blog-sidebar [display:none] flex-col gap-15 xl:flex ${className}`}>
      {visibleSections.map((section, idx) => (
        <React.Fragment key={`secfrag-${idx}`}>
          {/* Section */}
          <div className="blog-sidebar__section flex flex-col gap-legacy-15">
            <h3 className="type-3xl type-extrabold type-uppercase mt-0 mb-0">{section.title}</h3>
            <div className="blog-sidebar__list flex flex-col gap-7.5">
              {section.items.map((item) => (
                <BlogSidebarCard key={item.id} item={item} />
              ))}
            </div>

            {idx === 0 && banner}
          </div>
        </React.Fragment>
      ))}
      {visibleSections.length === 0 && banner}
    </aside>
  );
}
