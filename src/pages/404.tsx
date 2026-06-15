/**
 * 404.tsx — Custom "Page Not Found" error page
 *
 * In Next.js, a file named exactly `404.tsx` becomes the custom 404 error page.
 * It is rendered whenever:
 *  - A URL doesn't match any page file in /pages/
 *  - A dynamic page returns `{ notFound: true }` from getStaticProps/getServerSideProps
 *  - A dynamic route path doesn't match any known slug
 *
 * WHY CUSTOMIZE THE 404 PAGE?
 *  The default Next.js 404 is plain and has no site branding.
 *  This custom version shows the Shamanicca header and offers useful links
 *  so users aren't stranded — they can navigate to the shop or blog.
 *
 * STATIC PAGE:
 *  The 404 page has no data fetching — it's always the same content.
 *  Next.js statically generates it at build time.
 */

import { Fragment } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';

export default function NotFoundPage() {
  return (
    <Fragment>
      <Head>
        <title>404 - Page Not Found — Shamanicca</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="main">
            <div className="mt-lg-responsive mb-lg-responsive type-center">
              <h1 className="type-5xl type-extrabold mb-md-responsive">404</h1>
              <p className="type-2xl type-bold type-gray-70 mb-sm-responsive">Page Not Found</p>
              <p className="type-lg type-medium type-gray-60 mb-lg-responsive">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="flex gap-md justify-center">
                <Link href="/" className="btn btn-primary mr-30">
                  Shop
                </Link>
                <Link href="/blog" className="btn btn-secondary">
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </Fragment>
  );
}
