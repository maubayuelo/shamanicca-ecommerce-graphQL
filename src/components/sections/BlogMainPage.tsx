import React from 'react';
import Breadcrumb from '../molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from './BlogGrid';
import BlogHeader from './BlogHeader';
import BlogBanner from './BlogBanner';
import BlogSidebar from './BlogSidebar';
import BlogMainArticle from './BlogMainArticle';
import { useBanners } from '../../hooks/useBanners';

type BlogMainPageProps = {
  posts: BlogGridItem[];
  topReads?: BlogGridItem[];
  magicalPractices?: BlogGridItem[];
};

export default function BlogMainPage({ posts, topReads = [], magicalPractices = [] }: BlogMainPageProps) {
  const { banner } = useBanners(null);

  const mainArticle = posts[0];
  const remaining = posts.slice(1);
  const block1 = remaining.slice(0, 6);
  const block2 = remaining.slice(6, 10);

  const sidebarBanners = banner ? [{
    imageUrl: banner.banner_image,
    title: banner.banner_headline,
    subtitle: banner.banner_subtext,
    ctaLabel: banner.banner_cta_label,
    href: banner.banner_cta_url,
    isAffilliated: banner.banner_type === 'affiliate',
  }] : [];

  return (
    <div className="main">
      <div className="blog-layout mt-lg-responsive">
        <div className="blog-content">

          <BlogHeader
            title="Mindfulness, Wicca, White Magic, Alchemy & Shamanism Blog"
            subtitle=""
            className="mb-lg-responsive"
          />

          {mainArticle && (
            <BlogMainArticle item={mainArticle} />
          )}

          {banner && (
            <BlogBanner
              title={banner.banner_headline}
              subtitle={banner.banner_subtext}
              ctaLabel={banner.banner_cta_label}
              href={banner.banner_cta_url}
              imageUrl={banner.banner_image}
              imageUrlMedium={banner.banner_image_medium}
              imageUrlLarge={banner.banner_image_large}
              isAffilliated={banner.banner_type === 'affiliate'}
            />
          )}

          {block1.length > 0 && (
            <BlogGrid items={block1} className="mb-lg-responsive" />
          )}

          {banner && (
            <BlogBanner
              title={banner.banner_headline}
              subtitle={banner.banner_subtext}
              ctaLabel={banner.banner_cta_label}
              href={banner.banner_cta_url}
              imageUrl={banner.banner_image}
              imageUrlMedium={banner.banner_image_medium}
              imageUrlLarge={banner.banner_image_large}
              isAffilliated={banner.banner_type === 'affiliate'}
            />
          )}

          {block2.length > 0 && (
            <BlogGrid items={block2} ctaHref="/blog/all" ctaLabel="See All Posts" />
          )}

        </div>

        <BlogSidebar
          sections={[
            { title: 'Top Reads', items: topReads.length > 0 ? topReads : block1.slice(0, 3) },
            { title: 'Magical Practices', items: magicalPractices.length > 0 ? magicalPractices : block1.slice(3, 6) },
          ]}
          banners={sidebarBanners}
        />

      </div>
    </div>
  );
}
