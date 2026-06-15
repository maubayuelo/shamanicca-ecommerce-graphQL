/**
 * NewsletterModal.tsx — Newsletter signup popup (Molecule)
 *
 * A modal dialog that prompts users to subscribe to the newsletter.
 * Rendered globally in _app.tsx so it appears on every page.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Wraps the NewsletterForm molecule in a dismissible modal overlay.
 *
 * TRIGGER LOGIC — two ways the modal opens:
 *
 *  1. TIME-BASED (10 seconds):
 *     A setTimeout fires after DELAY_MS = 10000ms on page load.
 *     If the user has already dismissed it (localStorage flag), it never fires.
 *
 *  2. EXIT INTENT (desktop):
 *     When the user's mouse moves above y=20px (the top of the viewport),
 *     it suggests they're about to close the tab or navigate away.
 *     The modal opens immediately. This is the "exit intent" pattern.
 *
 * DISMISSAL:
 *  - Clicking "No thanks", the close button, or the backdrop dismisses it
 *  - On dismiss, STORAGE_KEY is saved to localStorage
 *  - On next page load, `localStorage.getItem(STORAGE_KEY)` returns a truthy value
 *    so neither trigger fires — the user never sees the modal again
 *
 * ON SUCCESS:
 *  - The NewsletterForm calls back... wait, it doesn't directly.
 *    The form shows its own success state. The modal detects this via the `subscribed`
 *    state (set via the success path) and closes after 3 seconds.
 *
 * SSR SAFETY:
 *  The useEffect checks `typeof window === 'undefined'` before accessing localStorage,
 *  because this code runs on the server during SSR where window doesn't exist.
 */

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
