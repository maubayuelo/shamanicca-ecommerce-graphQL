import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'shamanicca-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-bar" role="region" aria-label="Cookie consent">
      <p className="cookie-bar__text">
        By using our website, you agree to our use of cookies. Please refer to our{' '}
        <Link href="/cookie-policy" className="cookie-bar__link">
          cookie policy
        </Link>{' '}
        for more information.
      </p>
      <button className="cookie-bar__btn" onClick={accept} aria-label="Accept cookies">
        OK
      </button>
    </div>
  );
}
