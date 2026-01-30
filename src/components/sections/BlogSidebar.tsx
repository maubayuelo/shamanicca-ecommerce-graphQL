import React from 'react';
import Image from 'next/image';
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
        <React.Fragment key={`secfrag-${idx}`}>
          {/* Section */}
          <div className="blog-sidebar__section">
            <h3 className="type-3xl type-extrabold type-uppercase mt-0 mb-0">{section.title}</h3>
            <div className="blog-sidebar__list">
              {section.items.map((item) => (
                <BlogSidebarCard key={item.id} item={item} />
              ))}
            </div>

            {idx === 0 && banners[0] && (
              <BlogBannerSidebar
                className="mt-sm-responsive"
                imageUrl={banners[0].imageUrl}
                title={banners[0].title}
                subtitle={banners[0].subtitle}
                ctaLabel={banners[0].ctaLabel}
                href={banners[0].href}
              />
            )}
          </div>


        

          
        </React.Fragment>
      ))}
      {((banners && banners.length > 0) && (banners[1] || banners[0])) && (
        <BlogBannerSidebar
          className=""
          imageUrl={(banners[1] || banners[0]).imageUrl}
          title={(banners[1] || banners[0]).title}
          subtitle={(banners[1] || banners[0]).subtitle}
          ctaLabel={(banners[1] || banners[0]).ctaLabel}
          href={(banners[1] || banners[0]).href}
        />
      )}
    </aside>
  );
}