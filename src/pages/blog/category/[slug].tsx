import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../../components/organisms/Header';
import Footer from '../../../components/organisms/Footer';
import BlogHeader from '../../../components/sections/BlogHeader';
import BlogGrid, { type BlogGridItem } from '../../../components/sections/BlogGrid';
import BlogBanner from '../../../components/sections/BlogBanner';
import BlogSidebar from '../../../components/sections/BlogSidebar';
import Paginator from '../../../components/molecules/Paginator';
import { getAllPosts, getPostsByCategory } from '../../../utils/blogPosts';

const PAGE_SIZE = 9; // paginator every 9 posts

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Mindfulness & Healing': 'Gentle practices, grounding, and care for body and spirit.',
  'Practice & Rituals': 'Ritual techniques, sigils, candle magic, and daily workings.',
  'Tools & Altars': 'Crystals, altars, and practical tools for your craft.',
  'Astral & Cycles': 'Moon phases, planetary hours, and seasonal cycles.',
  'Herbs & Earth': 'Herbal allies, earth magic, and plant wisdom.',
  'Divination': 'Tarot, runes, pendulums, and reading with respect.',
  'Spirituality': 'Ancestor work, guides, and ethical spiritual practice.',
};

function useCategoryData(slug?: string) {
  const name = slug ? decodeURIComponent(slug) : '';
  const all = getAllPosts();
  const items: BlogGridItem[] = name ? getPostsByCategory(name) : all;
  const description = CATEGORY_DESCRIPTIONS[name] || '';
  return { name, description, items };
}

export default function BlogCategoryPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const pageParam = typeof router.query.page === 'string' ? parseInt(router.query.page, 10) : NaN;
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { name, description, items } = useCategoryData(slug);
  const totalItems = items.length;

  // Page slice
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = items.slice(start, end);

  // Interleave banner after every 6 items within the page
  const firstBlock = pageItems.slice(0, 6);
  const secondBlock = pageItems.slice(6);

  const hrefBuilder = (page: number) => {
    const base = `/blog/category/${encodeURIComponent(name)}`;
    return page === 1 ? base : `${base}?page=${page}`;
  };

  const sampleBanners = [
    {
      imageUrl: 'https://placehold.co/270x270.png',
      title: 'Intentioned Apparel',
      subtitle: 'Wear your protection. Embody your abundance.',
      ctaLabel: 'SHOP NOW!',
      href: '/shop',
    },
  ];

  const sidebarSections = [
    { title: 'Top Reads', items: items.slice(0, 3) },
    { title: 'Discover More', items: items.slice(3, 6) },
  ];

  return (
    <>
      <Head>
        <title>{name ? `${name} — Blog` : 'Blog Category'} — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Header />
          <div className="main">
            <div className="blog-layout mt-lg-responsive">
              <div className="blog-content">
                <BlogHeader title={name || 'Blog Category'} subtitle={description} className="mb-lg-responsive" />

                {/* Block 1 */}
                {firstBlock.length > 0 && (
                  <BlogGrid items={firstBlock} className="mb-lg-responsive" />
                )}

                {/* Banner after 6 items */}
                <BlogBanner
                  title="Intentioned Apparel"
                  subtitle="Wear your protection. Embody your abundance."
                  ctaLabel="SHOP NOW!"
                  href="/shop/apparel"
                  imageUrl="https://placehold.co/270x180"
                  className="mb-lg-responsive"
                />

                {/* Block 2 (remaining up to 9 per page) */}
                {secondBlock.length > 0 && (
                  <BlogGrid items={secondBlock} className="mb-lg-responsive" />
                )}

                {/* Paginator */}
                <Paginator
                  className="mt-lg-responsive"
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  hrefBuilder={hrefBuilder}
                />
              </div>

              <BlogSidebar sections={sidebarSections} banners={sampleBanners} />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </>
  );
}
