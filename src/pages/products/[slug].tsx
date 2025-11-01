import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { FEATURED_PRODUCTS_MOCK } from '../../utils/mockProducts';

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const product = React.useMemo(() => {
    if (!slug) return undefined;
    return FEATURED_PRODUCTS_MOCK.find((p) => p.slug === slug || String(p.id) === slug);
  }, [slug]);

  const title = product?.name || 'Product';
  const img = product?.image?.sourceUrl || 'https://placehold.co/1000x1000?text=Product';

  return (
    <>
      <Head>
        <title>{title} — Shamanicca</title>
      </Head>
      <main className="main">
        <div style={{ width: '100%', maxWidth: 980, margin: '30px auto' }}>
          <Link href="/" className="btn btn-secondary btn-small" aria-label="Go back">
            ← Back
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginTop: 20 }}>
            <div style={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
              <img src={img} alt={title} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div>
              <h1 style={{ margin: '10px 0' }}>{title}</h1>
              <p style={{ color: '#606060' }}>
                This is a placeholder product page for <strong>{title}</strong>. Replace this with real product content
                once the product route and API are ready.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
