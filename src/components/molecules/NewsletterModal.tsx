'use client';
import { useEffect, useState } from 'react';
import NewsletterForm from './NewsletterForm';

const STORAGE_KEY = 'shamanicca_newsletter_dismissed';
const DELAY_MS = 10000; // 10 seconds

export default function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Timed trigger
    const timer = setTimeout(() => setVisible(true), DELAY_MS);

    // Exit-intent trigger (desktop only)
    const onExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 20 && !localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        clearTimeout(timer);
      }
    };
    document.addEventListener('mouseleave', onExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onExitIntent);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleSuccess = () => {
    setSubscribed(true);
    localStorage.setItem(STORAGE_KEY, '1');
    // Close after a short pause so the user sees the success message
    setTimeout(() => setVisible(false), 3000);
  };

  if (!visible) return null;

  return (
    <div className="newsletter-modal" role="dialog" aria-modal="true" aria-label="Subscribe to our newsletter">
      <button className="newsletter-modal__backdrop" onClick={dismiss} aria-label="Close" />
      <div className="newsletter-modal__card">
        <button className="newsletter-modal__close" onClick={dismiss} aria-label="Close">✕</button>

        <div className="newsletter-modal__body">
          <div className="newsletter-modal__eyebrow type-sm type-bold type-uppercase">New drops & offers</div>
          <h2 className="newsletter-modal__title type-4xl type-extrabold">
            Get the<br />good stuff.
          </h2>
          <p className="newsletter-modal__desc type-md">
            Product drops, sacred knowledge and juicy updates. No spam — just things worth reading.
          </p>

          {subscribed ? (
            <div className="newsletter-success" role="alert">
              <p className="type-md type-bold">You&apos;re in! ✓</p>
              <p className="type-md">Welcome to the Shamanicca community.</p>
            </div>
          ) : (
            <NewsletterForm className="newsletter-modal__form" />
          )}

          <button className="newsletter-modal__skip type-sm" onClick={dismiss}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
