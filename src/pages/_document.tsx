/**
 * _document.tsx — Custom HTML document shell
 *
 * In Next.js, _document.tsx lets you customize the actual HTML file that is
 * sent to the browser. This is only rendered ONCE on the server — it wraps
 * the entire page and sets up the <html>, <head>, and <body> tags.
 *
 * IMPORTANT: This file is NOT a React component in the normal sense.
 * It runs only on the server (never in the browser) and should not contain
 * any client-side logic (no useState, no useEffect, no onClick handlers).
 *
 * USE CASES for _document.tsx:
 *  1. Adding meta tags that apply to every page (viewport, theme-color)
 *  2. Adding favicons and PWA manifest links
 *  3. Setting the <html lang="en"> attribute for accessibility/SEO
 *  4. Injecting global scripts in <head> (e.g. Schema.org JSON-LD for every page)
 *
 * WHAT'S IN THE <Head> HERE:
 *  - Favicon set: ico, 32x32, 16x16, apple-touch (180x180)
 *  - PWA manifest: site.webmanifest (lets the app be "installed" on mobile)
 *  - viewport: ensures proper mobile scaling
 *  - theme-color: sets the browser chrome color on mobile
 *  - JSON-LD: Organization + WebSite schema for every page (Google rich results)
 *
 * NOTE: Page-specific <head> content (title, description, og:) is handled by
 * the SeoHead component used in each individual page.
 */

import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicons and PWA manifest */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/favicon/site.webmanifest" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#ffffff" />
          {/* Font loaded via next/font; no external font links required */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                {
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  name: 'Shamanicca',
                  url: 'https://shamanicca.com',
                  logo: 'https://shamanicca.com/images/shamanicca-logo.svg',
                  contactPoint: { '@type': 'ContactPoint', email: 'contact@shamanicca.com', contactType: 'customer support' },
                },
                {
                  '@context': 'https://schema.org',
                  '@type': 'WebSite',
                  name: 'Shamanicca',
                  url: 'https://shamanicca.com',
                },
              ]),
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
