import type { GetStaticProps } from 'next';
import { Fragment } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

type Props = { page: WPPage | null };

export default function TermsAndConditionsPage({ page }: Props) {
  return (
    <Fragment>
      <SeoHead
        title={page ? page.title.rendered : 'Terms & Conditions'}
        description="Shamanicca terms and conditions."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/terms-and-conditions`}
        noRobots
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: page?.title.rendered || 'Terms & Conditions' }]}
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
  const page = await getWPPage('terms-and-conditions');
  return { props: { page }, revalidate: 60 };
};
