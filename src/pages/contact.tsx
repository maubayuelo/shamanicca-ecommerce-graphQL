/**
 * contact.tsx — Contact Us page (route: /contact)
 *
 * A contact form page that POSTs to the /api/contact serverless endpoint.
 * The page content (title and intro text) can optionally be managed in WordPress.
 *
 * DATA FETCHING:
 *  getStaticProps calls getWPPage('contact') — this fetches the WordPress page
 *  with slug "contact" via the WP REST API (not GraphQL).
 *  If the page exists in WordPress, its title and content are rendered above the form.
 *  If not (returns null), a hardcoded "Contact Us" heading is shown instead.
 *  revalidate: 60 → regenerates every minute (page content can change in WP).
 *
 * FORM ARCHITECTURE:
 *  - Controlled components: each input binds to a field in `form` state
 *  - Client-side validation: `validate()` runs before submission
 *  - Async submission: `handleSubmit` POSTs to /api/contact and handles errors
 *  - Success state: replaces form with a confirmation message
 *
 * VALIDATION PATTERN:
 *  validate() returns a `FieldError` object (Partial<FormState> without 'website').
 *  If the object has any keys → errors exist → block submission.
 *  Each field shows its specific error message next to it with role="alert".
 *
 * HONEYPOT ANTI-SPAM:
 *  A hidden "website" input field (position: absolute; left: -9999px) catches bots.
 *  Real users never see or fill it. If it has a value when submitted, the client
 *  returns a fake 200 success (so bots don't know they were blocked) but the
 *  /api/contact handler skips sending the email.
 *
 * SUBJECTS:
 *  Pre-defined select options match the allowlist in /api/contact.ts.
 *  The backend rejects any subject not in that list.
 */

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
type FormState = { name: string; email: string; subject: string; message: string; website: string };
type FieldError = Partial<Omit<FormState, 'website'>>;

export default function ContactPage({ page }: Props) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '', website: '' });
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
          <div className="page mt-legacy-15 lg:mt-legacy-25 mb-7.5 lg:mb-legacy-45">
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
              <div className="contact-success flex flex-col items-center text-center py-15 gap-legacy-15" role="alert">
                <div className="contact-success__icon w-[52px] h-[52px] rounded-[50%] bg-[#675dff] text-white flex items-center justify-center text-[1.4rem] [font-weight:700]">&#10003;</div>
                <p className="type-lg type-bold m-0">Message sent!</p>
                <p className="type-md">Thanks for reaching out — we&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <form className="contact-form flex flex-col gap-legacy-25 mt-7.5" onSubmit={handleSubmit} noValidate>
                {/* Honeypot — hidden from real users, bots fill it */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                />
                {serverError && (
                  <p className="contact-form__server-error type-sm bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-[8px] p-legacy-15 [margin:0]" role="alert">{serverError}</p>
                )}

                <div className="contact-form__row grid grid-cols-[1fr] gap-legacy-25 sm:grid-cols-[1fr_1fr]">
                  <div className={`form-field${errors.name ? ' form-field--error' : ''} flex flex-col gap-2.5 w-full`}>
                    <label htmlFor="c-name" className="form-field__label [font-family:Poppins,sans-serif] [font-size:16px] [line-height:28px] [@media(max-width:1024px)]:[line-height:26px] text-black flex items-center gap-1">
                      Name <span className="form-field__required text-[#e74c3c] [font-weight:700]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="c-name"
                      className="form-field__control [font-family:Poppins,sans-serif] [font-size:14px] [line-height:24px] p-[14px_16px] bg-white border-2 border-gray-300 rounded-[8px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-[#a5a5a5] [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 [.form-field--error_&]:border-[#e74c3c] [.form-field--error_&:focus]:border-[#e74c3c] [.form-field--error_&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(231,76,60,0.15)] [&:disabled]:bg-gray-100 [&:disabled]:text-gray-600 [&:disabled]:cursor-not-allowed [&:disabled::placeholder]:text-gray-500"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="Your name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'err-name' : undefined}
                    />
                    {errors.name && <span id="err-name" className="contact-form__field-error type-sm block text-[#c0392b] mt-1.25" role="alert">{errors.name}</span>}
                  </div>

                  <div className={`form-field${errors.email ? ' form-field--error' : ''} flex flex-col gap-2.5 w-full`}>
                    <label htmlFor="c-email" className="form-field__label [font-family:Poppins,sans-serif] [font-size:16px] [line-height:28px] [@media(max-width:1024px)]:[line-height:26px] text-black flex items-center gap-1">
                      Email <span className="form-field__required text-[#e74c3c] [font-weight:700]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="c-email"
                      className="form-field__control [font-family:Poppins,sans-serif] [font-size:14px] [line-height:24px] p-[14px_16px] bg-white border-2 border-gray-300 rounded-[8px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-[#a5a5a5] [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 [.form-field--error_&]:border-[#e74c3c] [.form-field--error_&:focus]:border-[#e74c3c] [.form-field--error_&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(231,76,60,0.15)] [&:disabled]:bg-gray-100 [&:disabled]:text-gray-600 [&:disabled]:cursor-not-allowed [&:disabled::placeholder]:text-gray-500"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="your@email.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'err-email' : undefined}
                    />
                    {errors.email && <span id="err-email" className="contact-form__field-error type-sm block text-[#c0392b] mt-1.25" role="alert">{errors.email}</span>}
                  </div>
                </div>

                <div className={`form-field${errors.subject ? ' form-field--error' : ''} flex flex-col gap-2.5 w-full`}>
                  <label htmlFor="c-subject" className="form-field__label [font-family:Poppins,sans-serif] [font-size:16px] [line-height:28px] [@media(max-width:1024px)]:[line-height:26px] text-black flex items-center gap-1">
                    Subject <span className="form-field__required text-[#e74c3c] [font-weight:700]" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="c-subject"
                    className="form-field__control form-field__select [font-family:Poppins,sans-serif] [font-size:14px] [line-height:24px] p-[14px_16px] bg-white border-2 border-gray-300 rounded-[8px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-[#a5a5a5] [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 [.form-field--error_&]:border-[#e74c3c] [.form-field--error_&:focus]:border-[#e74c3c] [.form-field--error_&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(231,76,60,0.15)] [&:disabled]:bg-gray-100 [&:disabled]:text-gray-600 [&:disabled]:cursor-not-allowed [&:disabled::placeholder]:text-gray-500 [cursor:pointer] [background-image:url(data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20stroke=%27%236b7280%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%271.5%27%20d=%27M6%208l4%204%204-4%27/%3e%3c/svg%3e)] [background-position:right_12px_center] [background-repeat:no-repeat] [background-size:16px] [padding-right:40px] [appearance:none]"
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
                  {errors.subject && <span id="err-subject" className="contact-form__field-error type-sm block text-[#c0392b] mt-1.25" role="alert">{errors.subject}</span>}
                </div>

                <div className={`form-field${errors.message ? ' form-field--error' : ''} flex flex-col gap-2.5 w-full`}>
                  <label htmlFor="c-message" className="form-field__label [font-family:Poppins,sans-serif] [font-size:16px] [line-height:28px] [@media(max-width:1024px)]:[line-height:26px] text-black flex items-center gap-1">
                    Message <span className="form-field__required text-[#e74c3c] [font-weight:700]" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    className="form-field__control [font-family:Poppins,sans-serif] [font-size:14px] p-[14px_16px] bg-white border-2 border-gray-300 rounded-[8px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-[#a5a5a5] [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 [.form-field--error_&]:border-[#e74c3c] [.form-field--error_&:focus]:border-[#e74c3c] [.form-field--error_&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(231,76,60,0.15)] [&:disabled]:bg-gray-100 [&:disabled]:text-gray-600 [&:disabled]:cursor-not-allowed [&:disabled::placeholder]:text-gray-500 resize-y min-h-[100px] [line-height:1.5]"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help…"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'err-message' : undefined}
                  />
                  {errors.message && <span id="err-message" className="contact-form__field-error type-sm block text-[#c0392b] mt-1.25" role="alert">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large contact-form__submit self-start min-w-[160px] disabled:opacity-[.65]"
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
