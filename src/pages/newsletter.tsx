import { Fragment, useState } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';

export default function NewsletterPage() {
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
    // TODO: wire to your email provider (Klaviyo, Mailchimp, ConvertKit, etc.)
    setSubmitted(true);
  };

  return (
    <Fragment>
      <SeoHead
        title="Join the Newsletter — Shamanicca"
        description="Get early access to new drops, exclusive offers, and intentional living inspiration. No spam, ever."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/newsletter`}
      />
      <Header />
      <main role="main">
        <div className="main pt-lg-responsive pb-lg-responsive">
          <div className="newsletter-page">
            <h1 className="type-4xl mt-0 mb-sm-responsive">Get The Good Stuff</h1>
            <p className="type-md type-gray-80 mb-md-responsive">
              Early access to new drops, exclusive offers, and intentional living inspiration.
              <br />No spam. Unsubscribe any time.
            </p>

            {submitted ? (
              <div className="newsletter-success" role="alert">
                <p className="type-md type-bold">You're in! ✓</p>
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
        </div>
        <Footer />
      </main>
    </Fragment>
  );
}
