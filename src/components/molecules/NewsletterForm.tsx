'use client';
import { useState } from 'react';

type Props = { className?: string };

export default function NewsletterForm({ className = '' }: Props) {
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

  if (submitted) {
    return (
      <div className={`newsletter-success ${className}`} role="alert">
        <p className="type-md type-bold">You&apos;re in! ✓</p>
        <p className="type-md">Welcome to the Shamanicca community. Check your inbox for a confirmation.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          aria-invalid={!!error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="type-sm"
          autoComplete="email"
          required
        />
        <button type="submit" className="newsletter-submit type-sm type-extrabold type-uppercase">
          Send
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
