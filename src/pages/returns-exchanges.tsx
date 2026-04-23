import type { GetStaticProps } from 'next';
import { Fragment } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

type Props = { page: WPPage };

export default function ReturnsExchangesPage({ page }: Props) {
  return (
    <Fragment>
      <SeoHead
        title={page.title.rendered}
        description="Shamanicca returns and exchanges policy."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/returns-exchanges`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: page.title.rendered }]}
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
  const page = await getWPPage('returns-exchanges');
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: { page }, revalidate: 60 };
};
