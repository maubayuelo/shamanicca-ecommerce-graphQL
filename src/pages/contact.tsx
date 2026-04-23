import type { GetStaticProps } from 'next';
import { Fragment, useState } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

type Props = { page: WPPage | null };

type FormState = { name: string; email: string; subject: string; message: string };
type FieldError = Partial<FormState>;

export default function ContactPage({ page }: Props) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): FieldError => {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (!form.message.trim()) e.message = 'Message is required.';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <SeoHead
        title={page ? page.title.rendered : 'Contact Us'}
        description="Get in touch with the Shamanicca team."
        canonical={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com'}/contact`}
      />
      <Header />
      <main>
        <section className="main-condensed content">
          <div className="page mt-md-responsive mb-lg-responsive">
            <Breadcrumb
              ariaLabel="Breadcrumb"
              items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]}
            />

            {page ? (
              <>
                <h1 className="type-5xl type-extrabold type-center" dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
                <div className="wp-content mb-md-responsive" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
              </>
            ) : (
              <h1 className="type-5xl type-extrabold type-center">Contact Us</h1>
            )}

            {submitted ? (
              <div className="contact-success" role="alert">
                <p className="type-lg type-bold">Message sent!</p>
                <p className="type-md">Thanks for reaching out — we&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {serverError && (
                  <p className="field-error type-sm mb-sm-responsive" role="alert">{serverError}</p>
                )}

                <div className={`field${errors.name ? ' field--error' : ''}`}>
                  <label htmlFor="contact-name" className="field-label type-sm type-bold">Name</label>
                  <input id="contact-name" className="form-control type-md" type="text" name="name"
                    value={form.name} onChange={handleChange} autoComplete="name"
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
                  {errors.name && <span id="err-name" className="field-error type-sm" role="alert">{errors.name}</span>}
                </div>

                <div className={`field${errors.email ? ' field--error' : ''}`}>
                  <label htmlFor="contact-email" className="field-label type-sm type-bold">Email</label>
                  <input id="contact-email" className="form-control type-md" type="email" name="email"
                    value={form.email} onChange={handleChange} autoComplete="email"
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} />
                  {errors.email && <span id="err-email" className="field-error type-sm" role="alert">{errors.email}</span>}
                </div>

                <div className={`field${errors.subject ? ' field--error' : ''}`}>
                  <label htmlFor="contact-subject" className="field-label type-sm type-bold">Subject</label>
                  <input id="contact-subject" className="form-control type-md" type="text" name="subject"
                    value={form.subject} onChange={handleChange}
                    aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'err-subject' : undefined} />
                  {errors.subject && <span id="err-subject" className="field-error type-sm" role="alert">{errors.subject}</span>}
                </div>

                <div className={`field${errors.message ? ' field--error' : ''}`}>
                  <label htmlFor="contact-message" className="field-label type-sm type-bold">Message</label>
                  <textarea id="contact-message" className="form-control type-md" name="message" rows={6}
                    value={form.message} onChange={handleChange}
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? 'err-message' : undefined} />
                  {errors.message && <span id="err-message" className="field-error type-sm" role="alert">{errors.message}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-large mt-sm-responsive" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Message'}
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
  const page = await getWPPage('contact');
  return { props: { page }, revalidate: 60 };
};
