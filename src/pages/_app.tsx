import type { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client/react';
import client from '../lib/graphql/apolloClient';
import '../styles/globals.scss';
import '../styles/components/header.scss';
import '../styles/pages/product.scss';
import { Poppins } from 'next/font/google';

// Load Poppins font globally using next/font (pages router)
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '900'],
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  // Debug: log component identity to help diagnose invalid element errors
  try {
    // eslint-disable-next-line no-console
    console.log('[_app] Rendering Component:', Component && (Component.displayName || Component.name || typeof Component));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[_app] Error logging Component:', err);
  }

  // Extra debug: check Apollo imports
  try {
    // eslint-disable-next-line no-console
    console.log('[_app] ApolloProvider type:', typeof ApolloProvider, 'client type:', typeof client);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[_app] Error logging Apollo types:', e);
  }

  // Wrap app with ApolloProvider so hooks like useQuery have access to the client
  return (
    <ApolloProvider client={client}>
      <div className={poppins.className}>
        <Component {...pageProps} />
      </div>
    </ApolloProvider>
  );
}
