import type { GetStaticProps } from 'next';
import { Fragment, useState } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

type Props = { page: WPPage | null };

export default function NewsletterPage({ page }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <Fragment>
      <SeoHead
        title={page ? page.title.rendered : 'Newsletter'}
        description="Get early access to new drops, exclusive offers, and intentional living inspiration."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/newsletter`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: page?.title.rendered || 'Newsletter' }]}
            />
            {page && (
              <>
                <h1
                  className="type-4xl type-extrabold mt-0 mb-sm-responsive"
                  dangerouslySetInnerHTML={{ __html: page.title.rendered }}
                />
                <div
                  className="wp-content type-md type-gray-80 mb-md-responsive"
                  dangerouslySetInnerHTML={{ __html: page.content.rendered }}
                />
              </>
            )}

            {submitted ? (
              <div className="newsletter-success" role="alert">
                <p className="type-md type-bold">You&apos;re in! ✓</p>
                <p className="type-md">Welcome to the Shamanicca community. Check your inbox for a confirmation.</p>
              </div>
            ) : (
              <form className="newsletter-form newsletter-form--page" onSubmit={handleSubmit} noValidate>
                <div className={`field${error ? ' field--error' : ''}`}>
                  <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
                  <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="type-md"
                    autoComplete="email"
                    required
                  />
                  {error && (
                    <span id="newsletter-error" className="field-error type-sm" role="alert">
                      {error}
                    </span>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-large mt-sm-responsive">
                  Subscribe
                </button>
              </form>
            )}
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
