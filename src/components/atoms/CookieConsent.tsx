import React from 'react';
import Link from 'next/link';
import { useCookieConsent } from '../../lib/context/cookieConsent';

export default function CookieConsent() {
  const { consent, acceptAll, rejectAll } = useCookieConsent();

  if (consent.decided) return null;

  return (
    <div className="cookie-bar" role="region" aria-label="Cookie consent" aria-live="polite">
      <p className="cookie-bar__text">
        We use cookies to improve your experience. Read our{' '}
        <Link href="/cookie-policy" className="cookie-bar__link">
          cookie policy
        </Link>
        .
      </p>
      <div className="cookie-bar__actions">
        <button className="cookie-bar__btn cookie-bar__btn--ghost" onClick={rejectAll}>
          Necessary only
        </button>
        <button className="cookie-bar__btn cookie-bar__btn--primary" onClick={acceptAll}>
          Accept all
        </button>
      </div>
    </div>
  );
}
