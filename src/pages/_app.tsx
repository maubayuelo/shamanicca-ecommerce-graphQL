/**
 * _app.tsx — Root of the entire application
 *
 * In Next.js, _app.tsx is a special file that wraps EVERY page.
 * Think of it as the outermost shell of the app. Whatever you put here
 * is present on every single page the user visits.
 *
 * This file is responsible for:
 *  1. Providing global state (Cart, Wishlist, Cookie Consent) via React Context
 *  2. Setting up Apollo Client (GraphQL) so any page can run queries
 *  3. Loading global CSS styles once (not per-page)
 *  4. Loading the Poppins font from Google Fonts
 *  5. Injecting Google Analytics scripts (with GDPR consent defaults)
 *  6. Rendering global UI elements: announcement banner, GoTop button,
 *     cookie consent popup, newsletter modal
 */

import type { AppProps } from 'next/app';
import Script from 'next/script';
import { ApolloProvider } from '@apollo/client/react';
import client from '../lib/graphql/apolloClient';
// Global styles loaded once here — apply to every page
import '../styles/globals.scss';
import '../styles/components/header.scss';
import '../styles/pages/product.scss';
import '../styles/pages/about.scss';
import '../styles/pages/cart.scss';
import '../styles/pages/wishlist.scss';
import { Poppins } from 'next/font/google';
import { CartProvider } from '../lib/context/cart';
import { WishlistProvider } from '../lib/context/wishlist';
import { CookieConsentProvider } from '../lib/context/cookieConsent';
import GoTop from '../components/atoms/GoTop';
import CookieConsent from '../components/atoms/CookieConsent';
import AnnouncementBanner from '../components/atoms/AnnouncementBanner';
import NewsletterModal from '../components/molecules/NewsletterModal';

// Load the Poppins font from Google Fonts.
// next/font downloads and self-hosts the font at build time — no request to Google at runtime.
// This improves privacy and avoids layout shifts (display: 'swap' shows fallback font first).
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '900'],
  display: 'swap',
});

// Read GA config from environment variables.
// NEXT_PUBLIC_ prefix means these are safe to expose in the browser.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_ENABLED = process.env.NEXT_PUBLIC_GA_ENABLED === 'true' && Boolean(GA_ID);

/**
 * App — the root component
 *
 * @param Component — the current page component (changes on every navigation)
 * @param pageProps — the props returned by getStaticProps/getServerSideProps of that page
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    // ApolloProvider makes the Apollo Client (GraphQL) available to every component
    // via the useQuery() and useMutation() hooks
    <ApolloProvider client={client}>
      {/* CartProvider stores cart items in state + syncs to localStorage */}
      <CartProvider>
        {/* WishlistProvider stores wishlisted items in state + syncs to localStorage */}
        <WishlistProvider>
          {/* CookieConsentProvider tracks whether the user accepted/declined cookies */}
          <CookieConsentProvider>
            {/* Apply the Poppins font class to the entire app */}
            <div className={poppins.className}>

              {/* Google Analytics — only injected when enabled in env variables */}
              {GA_ENABLED && (
                <>
                  {/*
                    Consent Mode v2: set defaults to denied BEFORE gtag.js loads.
                    This means GA will NOT collect any data until the user explicitly
                    accepts cookies. When they do, CookieConsentProvider calls:
                      gtag('consent', 'update', { analytics_storage: 'granted' })
                    This is required for GDPR compliance in the EU.
                  */}
                  <Script id="ga-consent-default" strategy="afterInteractive">
                    {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){ dataLayer.push(arguments); }
                    gtag('consent', 'default', {
                      analytics_storage: 'denied',
                      ad_storage: 'denied',
                      functionality_storage: 'granted',
                      security_storage: 'granted'
                    });
                  `}
                  </Script>
                  {/* Load the GA4 script — it will respect the consent defaults above */}
                  <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                    strategy="afterInteractive"
                  />
                  {/* Initialize GA4 with the measurement ID */}
                  <Script id="ga-init" strategy="afterInteractive">
                    {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){ dataLayer.push(arguments); }
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                  `}
                  </Script>
                </>
              )}

              {/* Announcement bar above the header (e.g. "Free shipping on orders $50+") */}
              <AnnouncementBanner />

              {/* The actual current page — this changes on every route navigation */}
              <Component {...pageProps} />

              {/* Fixed "scroll to top" button that appears after scrolling down */}
              <GoTop />

              {/* Cookie consent banner at the bottom of the screen */}
              <CookieConsent />

              {/* Newsletter signup modal (appears after a delay or user interaction) */}
              <NewsletterModal />
            </div>
          </CookieConsentProvider>
        </WishlistProvider>
      </CartProvider>
    </ApolloProvider>
  );
}
