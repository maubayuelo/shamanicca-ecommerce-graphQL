import type { AppProps } from 'next/app';
import Script from 'next/script';
import { ApolloProvider } from '@apollo/client/react';
import client from '../lib/graphql/apolloClient';
import '../styles/globals.scss';
import '../styles/components/header.scss';
import '../styles/pages/product.scss';
import '../styles/pages/about.scss';
import '../styles/pages/cart.scss';
import { Poppins } from 'next/font/google';
import { CartProvider } from '../lib/context/cart';
import GoTop from '../components/atoms/GoTop';
import CookieConsent from '../components/atoms/CookieConsent';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '900'],
  display: 'swap',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_ENABLED = process.env.NEXT_PUBLIC_GA_ENABLED === 'true' && Boolean(GA_ID);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <div className={poppins.className}>
          {GA_ENABLED && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="ga-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                `}
              </Script>
            </>
          )}
          <Component {...pageProps} />
          <GoTop />
          <CookieConsent />
        </div>
      </CartProvider>
    </ApolloProvider>
  );
}
