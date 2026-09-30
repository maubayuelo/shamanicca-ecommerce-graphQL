import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import NewsletterForm from '../components/molecules/NewsletterForm';
import { NewsletterConfirmation } from '../components/atoms/NewsletterConfirmation';
import { getWPPage, type WPPage } from '../lib/getWPPage';
import { decodeEntities } from '../utils/html';

type Props = { page: WPPage | null };

export default function NewsletterPage({ page }: Props) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const pageTitle = decodeEntities(page?.title.rendered || 'Newsletter');

  // Static pages receive query parameters after hydration; avoid flashing signup copy.
  useEffect(() => {
    if (router.isReady) setConfirmed(router.query.confirmed === '1');
  }, [router.isReady, router.query.confirmed]);

  return (
    <Fragment>
      <SeoHead
        title={confirmed ? 'Newsletter confirmed' : pageTitle}
        description={confirmed ? 'Welcome to the Shamanicca newsletter.' : 'Get early access to new drops, exclusive offers, and intentional living inspiration.'}
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/newsletter`}
        noRobots={confirmed === true}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-legacy-15 lg:mt-legacy-25 mb-7.5 lg:mb-legacy-45">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: pageTitle }]}
            />
            {confirmed === null ? null : confirmed ? (
              <>
                <NewsletterConfirmation
                  heading="h1"
                  className="py-15"
                  title="You're in!"
                  message="Thank you for confirming your subscription. Welcome to the Shamanicca community."
                />
                <p className="type-md type-center">
                  <Link href="/blog" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#675dff]">Explore the blog</Link>
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>
      </main>
      <Footer showNewsletterSignup={false} />
    </Fragment>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const page = await getWPPage('newsletter');
  return { props: { page }, revalidate: 60 };
};
