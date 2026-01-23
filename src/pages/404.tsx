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
