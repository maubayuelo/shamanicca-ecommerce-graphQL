/**
 * NewsletterForm.tsx — Email subscription form (Molecule)
 *
 * A standalone email input + submit button that POSTs to /api/newsletter.
 * Used inside the NewsletterModal and potentially on other pages.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines an input (atom) + button (atom) with fetch logic and state management.
 *
 * STATE MACHINE:
 * The component has 4 states:
 *  'idle'    → initial state, form is ready
 *  'loading' → API call in progress (button shows "...")
 *  'success' → email submitted successfully (form replaced with success message)
 *  'error'   → API returned an error (error message shown below the form)
 *
 * FORM FLOW:
 *  1. User types email and submits
 *  2. Quick client-side validation (must contain "@")
 *  3. POST to /api/newsletter with { email }
 *  4. On success: show "You're in!" message
 *  5. On error: show error text below form, allow retry
 *
 * NOTE: The server-side /api/newsletter handles the actual Mailchimp call,
 * keeping the API key secret from the browser.
 */

'use client';
import { useState } from 'react';

type Props = { className?: string };

export default function NewsletterForm({ className = '' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setError('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`newsletter-success ${className}`} role="alert">
        <p className="type-md type-bold">You&apos;re in! ✓</p>
        <p className="type-md">Welcome to the Shamanicca community. Check your inbox soon.</p>
      </div>
    );
  }

  return (
    <div className={className}>
        <form
          className="newsletter-form flex gap-0 overflow-hidden rounded-[10px] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]"
          onSubmit={handleSubmit}
          noValidate
        >
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          aria-invalid={!!error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="type-sm flex-1 p-[15px] bg-white border border-gray-300 border-r-0 rounded-[10px_0_0_10px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-gray-500 [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:[&::placeholder]:text-gray-500"
          autoComplete="email"
          required
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className="newsletter-submit type-sm type-extrabold type-uppercase [border:none] cursor-pointer whitespace-nowrap [transition:opacity_0.2s_ease,transform_0.05s_ease-in-out,background-color_0.2s_ease] bg-[#675dff] text-white p-[15px_30px] rounded-[0_10px_10px_0] [&:hover]:text-white [&:hover]:bg-black [&:hover]:[text-decoration:none] [&:active]:text-white [&:active]:bg-black [&:active]:[text-decoration:none]"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '...' : 'Send'}
        </button>
      </form>
      {error && (
        <span id="newsletter-error" className="field-error type-sm" role="alert" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </span>
      )}
    </div>
  );
}
