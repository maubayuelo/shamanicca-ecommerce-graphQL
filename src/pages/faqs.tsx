import type { GetStaticProps } from 'next';
import { Fragment } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

type Props = { page: WPPage | null };

export default function FaqsPage({ page }: Props) {
  return (
    <Fragment>
      <SeoHead
        title={page ? page.title.rendered : 'FAQs'}
        description="Frequently asked questions about Shamanicca products, shipping, and more."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/faqs`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: page?.title.rendered || 'FAQs' }]}
            />
            {page ? (
              <>
                <h1 className="type-5xl type-extrabold" dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
                <div className="wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
              </>
            ) : (
              <div className="wp-content">
                <h1 className="type-5xl type-extrabold">Page not found</h1>
                <p className="type-md">We could not find this page. <a href="/">Return home</a>.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const page = await getWPPage('faqs');
  return { props: { page }, revalidate: 60 };
};
