import React from 'react';
import Link from 'next/link';
import { useCookieConsent } from '../../lib/context/cookieConsent';

export default function CookieConsent() {
  const { consent, acceptAll, rejectAll } = useCookieConsent();

  if (consent.decided) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9000] flex flex-col items-start gap-legacy-15 p-5 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] animate-cookie-slide-up sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:py-legacy-15 sm:px-7.5"
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <p className="m-0 text-[13px] leading-[1.6] text-gray-800">
        We use cookies to improve your experience. Read our{' '}
        <Link href="/cookie-policy" className="text-primary-500 underline underline-offset-2 hover:text-primary-800">
          cookie policy
        </Link>
        .
      </p>
      <div className="flex items-center gap-2.5 shrink-0 w-full justify-end sm:w-auto sm:justify-start">
        <button
          className="[font-family:inherit] rounded-full py-2 px-5 text-[13px] font-black whitespace-nowrap cursor-pointer [transition:background_0.2s_ease,color_0.2s_ease,border-color_0.2s_ease,transform_0.1s_ease] active:[transform:scale(0.97)] bg-transparent border border-gray-300 text-gray-800 hover:bg-black hover:text-white hover:border-black"
          onClick={rejectAll}
        >
          Necessary only
        </button>
        <button
          className="[font-family:inherit] rounded-full py-2 px-5 text-[13px] font-black whitespace-nowrap cursor-pointer [transition:background_0.2s_ease,color_0.2s_ease,border-color_0.2s_ease,transform_0.1s_ease] active:[transform:scale(0.97)] bg-primary-500 border border-transparent text-white hover:bg-black"
          onClick={acceptAll}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
