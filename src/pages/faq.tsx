/**
 * faq.tsx — Frequently Asked Questions page (route: /faq)
 *
 * A CMS-driven page — all content comes from WordPress, zero hardcoded text.
 *
 * DATA FETCHING:
 *  getStaticProps calls getWPPage('faq') → fetches the WordPress page
 *  with slug "faq" via the WP REST API.
 *  If the page doesn't exist in WordPress → `notFound: true` → Next.js shows 404.
 *  revalidate: 60 → regenerates every minute so WP edits go live quickly.
 *
 * CONTENT RENDERING:
 *  `dangerouslySetInnerHTML={{ __html: page.content.rendered }}`
 *  This injects WordPress HTML content directly into the DOM.
 *
 *  WHY IS IT SAFE HERE?
 *  The content comes from our own WordPress admin — not from users.
 *  We trust the CMS authors not to inject malicious scripts.
 *  The class "wp-content" in the stylesheet applies WordPress-compatible styles
 *  (headings, lists, paragraphs, images) to the rendered HTML.
 *
 * TITLE ENCODING:
 *  `decodeEntities(page.title.rendered)` converts HTML entities in the WordPress
 *  title (e.g. &amp; → &, &#8220; → ") before passing to SeoHead.
 *  The heading renders the title with dangerouslySetInnerHTML directly
 *  since it can contain WordPress-formatted HTML (bold, etc.).
 *
 * PATTERN — "WordPress-driven static page":
 *  This same pattern (getWPPage + dangerouslySetInnerHTML) is used for:
 *  about.tsx, privacy-policy.tsx, returns-exchanges.tsx, size-chart.tsx,
 *  terms-and-conditions.tsx, newsletter.tsx — all CMS-managed content pages.
 */

import type { GetStaticProps } from 'next';
import { Fragment } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';
import { decodeEntities } from '../utils/html';

type Props = { page: WPPage };

export default function FaqPage({ page }: Props) {
  return (
    <Fragment>
      <SeoHead
        title={decodeEntities(page.title.rendered)}
        description="Frequently asked questions about Shamanicca products, shipping, and more."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/faq`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: decodeEntities(page.title.rendered) }]}
            />
            <h1 className="type-5xl type-extrabold type-center" dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
            <div className="wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const page = await getWPPage('faq');
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: { page }, revalidate: 60 };
};
