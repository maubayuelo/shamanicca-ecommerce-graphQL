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
