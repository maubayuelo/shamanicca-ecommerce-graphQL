import React from 'react';
import Breadcrumb from '../molecules/Breadcrumb';
import BlogGrid, { type BlogGridItem } from './BlogGrid';
import BlogHeader from './BlogHeader';
import BlogBanner from './BlogBanner';
import BlogSidebar from './BlogSidebar';

type BlogMainPageProps = {
  posts: BlogGridItem[];
};

export default function BlogMainPage({ posts }: BlogMainPageProps) {
  // Derive layout pieces: first item as main article, then 3 blocks, banners in-between
  const mainArticle = posts[0];
  const remaining = posts.slice(1);
  const block1 = remaining.slice(0, 4);
  const block2 = remaining.slice(4, 8);
  const block3 = remaining.slice(8, 12);



  const sampleBanners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
    },
  ];



  return (
    <div className="main">
      <div className="blog-layout mt-lg-responsive">
        <div className="blog-content">
        
          {/* Blog Header (SEO helper) */}
          <BlogHeader
            title="Mindfulness, Wicca, White Magic, Alchemy & Shamanism Blog"
            subtitle=""
          />

          {/* Main Article */}
          {mainArticle && (
            <section className="blog-main-article">
              <a href={mainArticle.href || '#'} className="blog-main-article__thumb" aria-label={`Read ${mainArticle.title}`}>
                {/* large image, rely on CSS height */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainArticle.imageUrl || 'https://placehold.co/915x531.png'} alt="" />
              </a>
              <div className="blog-main-article__body">
                <h1 className="type-2xl type-extrabold m-0">
                  <a href={mainArticle.href || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>{mainArticle.title}</a>
                </h1>
                {mainArticle.summary && <p className="type-md m-0">{mainArticle.summary}</p>}
              </div>
            </section>
          )}

          {/* Block 1 (no section title or CTA) */}
          {block1.length > 0 && (
            <BlogGrid items={block1} />
          )}

          {/* Banner 1 */}
          <BlogBanner
            title="Intentioned Apparel"
            subtitle="Wear your protection. Embody your abundance."
            ctaLabel="SHOP NOW!"
            href="/shop/apparel"
            imageUrl="https://placehold.co/270x180"
          />

          {/* Block 2 */}
          {block2.length > 0 && (
            <BlogGrid items={block2} />
          )}

          {/* Banner 2 */}
          <BlogBanner
            title="Manifestation Audibles"
            subtitle="Guided meditations and subliminal audios."
            ctaLabel="LISTEN"
            href="/shop/audios"
            imageUrl="https://placehold.co/270x180"
          />

          {/* Block 3 */}
          {block3.length > 0 && (
            <BlogGrid
            items={block3}
            ctaHref="/blog"
            ctaLabel="Check All Blog Posts"/>
          )}
        </div>

        {/* Sidebar with titles, posts, and banners */}
        <BlogSidebar
          sections={[
            { title: 'Top Reads', items: remaining.slice(0, 3) },
            { title: 'Mysticysm 101', items: remaining.slice(3,6) },
          ]}
          banners={sampleBanners} 
          
        />
       
      </div>
    </div>
  );
}
