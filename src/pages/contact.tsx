import type { GetStaticProps } from 'next';
import { Fragment, useState } from 'react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { getWPPage, type WPPage } from '../lib/getWPPage';

const SUBJECTS = [
  'Order Support',
  'Returns & Exchanges',
  'Sizing Help',
  'Wholesale & Collaboration',
  'Press & Media',
  'Other',
];

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
    if (!form.subject) e.subject = 'Please select a subject.';
    if (!form.message.trim()) e.message = 'Message is required.';
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        title="Contact Us — Shamanicca"
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
                {page.content.rendered && (
                  <div className="wp-content mb-md-responsive" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
                )}
              </>
            ) : (
              <h1 className="type-5xl type-extrabold type-center">Contact Us</h1>
            )}

            {submitted ? (
              <div className="contact-success" role="alert">
                <div className="contact-success__icon">&#10003;</div>
                <p className="type-lg type-bold m-0">Message sent!</p>
                <p className="type-md">Thanks for reaching out — we&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {serverError && (
                  <p className="contact-form__server-error type-sm" role="alert">{serverError}</p>
                )}

                <div className="contact-form__row">
                  <div className={`form-field${errors.name ? ' form-field--error' : ''}`}>
                    <label htmlFor="c-name" className="form-field__label">
                      Name <span className="form-field__required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="c-name"
                      className="form-field__control"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="Your name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'err-name' : undefined}
                    />
                    {errors.name && <span id="err-name" className="contact-form__field-error type-sm" role="alert">{errors.name}</span>}
                  </div>

                  <div className={`form-field${errors.email ? ' form-field--error' : ''}`}>
                    <label htmlFor="c-email" className="form-field__label">
                      Email <span className="form-field__required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="c-email"
                      className="form-field__control"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="your@email.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'err-email' : undefined}
                    />
                    {errors.email && <span id="err-email" className="contact-form__field-error type-sm" role="alert">{errors.email}</span>}
                  </div>
                </div>

                <div className={`form-field${errors.subject ? ' form-field--error' : ''}`}>
                  <label htmlFor="c-subject" className="form-field__label">
                    Subject <span className="form-field__required" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="c-subject"
                    className="form-field__control form-field__select"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'err-subject' : undefined}
                  >
                    <option value="" disabled>Select a topic…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <span id="err-subject" className="contact-form__field-error type-sm" role="alert">{errors.subject}</span>}
                </div>

                <div className={`form-field${errors.message ? ' form-field--error' : ''}`}>
                  <label htmlFor="c-message" className="form-field__label">
                    Message <span className="form-field__required" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    className="form-field__control"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help…"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'err-message' : undefined}
                  />
                  {errors.message && <span id="err-message" className="contact-form__field-error type-sm" role="alert">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large contact-form__submit"
                  disabled={loading}
                >
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
