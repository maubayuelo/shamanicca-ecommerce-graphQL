import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@apollo/client/react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import { SEARCH_PRODUCTS, SEARCH_POSTS } from '../lib/graphql/queries';
import { cleanExcerpt, decodeEntities } from '../utils/html';
import { pickImage } from '../lib/graphql/utils';

type Scope = 'shop' | 'blog';

export default function SearchPage() {
  const router = useRouter();
  const rawQ = typeof router.query.q === 'string' ? router.query.q : '';
  const rawScope = router.query.scope === 'blog' ? 'blog' : 'shop';

  const [scope, setScope] = useState<Scope>(rawScope);

  // Keep scope tab in sync when URL changes
  useEffect(() => {
    setScope(rawScope);
  }, [rawScope]);

  const changeScope = (next: Scope) => {
    router.replace(
      { pathname: '/search', query: { q: rawQ, scope: next } },
      undefined,
      { shallow: true },
    );
  };

  const { data: productsData, loading: productsLoading } = useQuery(SEARCH_PRODUCTS, {
    variables: { search: rawQ, first: 12 },
    skip: !rawQ || scope !== 'shop',
  });

  const { data: postsData, loading: postsLoading } = useQuery(SEARCH_POSTS, {
    variables: { query: rawQ, first: 12 },
    skip: !rawQ || scope !== 'blog',
  });

  const products: any[] = productsData?.products?.nodes ?? [];
  const posts: any[] = postsData?.posts?.nodes ?? [];
  const isLoading = scope === 'shop' ? productsLoading : postsLoading;

  return (
    <Fragment>
      <SeoHead
        title={rawQ ? `Search: "${rawQ}" — Shamanicca` : 'Search — Shamanicca'}
        description={`Search results for "${rawQ}" on Shamanicca.`}
      />
      <Header />
      <main className="search-page" role="main">
        <div className="main pt-lg-responsive pb-lg-responsive">
          <h1 className="type-4xl mt-0 mb-sm-responsive">
            {rawQ ? <>Results for <em>"{rawQ}"</em></> : 'Search'}
          </h1>

          {/* Scope tabs */}
          <div className="search-tabs mb-md-responsive" role="tablist" aria-label="Search scope">
            <button
              role="tab"
              aria-selected={scope === 'shop'}
              className={`search-tab type-sm type-bold${scope === 'shop' ? ' is-active' : ''}`}
              onClick={() => changeScope('shop')}
            >
              Shop
            </button>
            <button
              role="tab"
              aria-selected={scope === 'blog'}
              className={`search-tab type-sm type-bold${scope === 'blog' ? ' is-active' : ''}`}
              onClick={() => changeScope('blog')}
            >
              Blog
            </button>
          </div>

          {!rawQ && (
            <p className="type-md type-gray-80">Enter a search term above to find products and articles.</p>
          )}

          {rawQ && isLoading && (
            <p className="type-md type-gray-80">Searching…</p>
          )}

          {/* Shop results */}
          {rawQ && scope === 'shop' && !productsLoading && (
            <>
              {products.length === 0 ? (
                <p className="type-md type-gray-80">No products found for "{rawQ}".</p>
              ) : (
                <ul className="search-results-grid">
                  {products.map((p: any) => {
                    const price = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
                    return (
                      <li key={p.id} className="search-result-card">
                        <Link href={`/products/${p.slug}`} className="search-result-link">
                          <div className="search-result-img">
                            {p.image?.sourceUrl ? (
                              <Image
                                src={p.image.sourceUrl}
                                alt={p.name}
                                width={240}
                                height={240}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              />
                            ) : (
                              <div className="search-result-img-placeholder" aria-hidden />
                            )}
                          </div>
                          <div className="search-result-info">
                            <p className="type-md type-bold mb-0">{decodeEntities(p.name)}</p>
                            {price > 0 && <p className="type-sm type-gray-80">${price.toFixed(2)}</p>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* Blog results */}
          {rawQ && scope === 'blog' && !postsLoading && (
            <>
              {posts.length === 0 ? (
                <p className="type-md type-gray-80">No articles found for "{rawQ}".</p>
              ) : (
                <ul className="search-results-list">
                  {posts.map((p: any) => {
                    const imgUrl = pickImage(p, 'medium');
                    return (
                      <li key={p.databaseId} className="search-result-row">
                        <Link href={`/blog/${p.slug}`} className="search-result-row-link">
                          {imgUrl && (
                            <div className="search-result-row-img">
                              <Image src={imgUrl} alt="" width={120} height={90} style={{ objectFit: 'cover' }} />
                            </div>
                          )}
                          <div className="search-result-row-info">
                            <p className="type-md type-bold mb-0">{decodeEntities(p.title || '')}</p>
                            <p className="type-sm type-gray-80">{cleanExcerpt(p.excerpt || '').slice(0, 120)}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
        <Footer />
      </main>
    </Fragment>
  );
}
