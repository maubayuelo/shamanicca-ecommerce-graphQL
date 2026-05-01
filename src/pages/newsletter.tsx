import type { GetStaticProps } from 'next';
import { Fragment } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import NewsletterForm from '../components/molecules/NewsletterForm';
import { getWPPage, type WPPage } from '../lib/getWPPage';
import { decodeEntities } from '../utils/html';

type Props = { page: WPPage | null };

export default function NewsletterPage({ page }: Props) {
  const pageTitle = decodeEntities(page?.title.rendered || 'Newsletter');

  return (
    <Fragment>
      <SeoHead
        title={pageTitle}
        description="Get early access to new drops, exclusive offers, and intentional living inspiration."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/newsletter`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: pageTitle }]}
            />
            <h1
              className="type-5xl type-extrabold type-center"
              dangerouslySetInnerHTML={{ __html: page?.title.rendered || 'Newsletter' }}
            />
            {page?.content.rendered && (
              <div
                className="wp-content"
                dangerouslySetInnerHTML={{ __html: page.content.rendered }}
              />
            )}
            <NewsletterForm className="mt-md-responsive" />
          </div>
        </section>
      </main>
      <Footer />
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const page = await getWPPage('newsletter');
  return { props: { page }, revalidate: 60 };
};
