import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import ProductsGrid, { type FeaturedProduct } from '../components/sections/ProductsGrid';
import BlogGrid, { type BlogGridItem } from '../components/sections/BlogGrid';
import { SEARCH_PRODUCTS, SEARCH_POSTS } from '../lib/graphql/queries';
import { cleanExcerpt, decodeEntities } from '../utils/html';
import { pickImage } from '../lib/graphql/utils';

type Scope = 'shop' | 'blog';

export default function SearchPage() {
  const router = useRouter();
  const rawQ = typeof router.query.q === 'string' ? router.query.q : '';
  const rawScope = router.query.scope === 'blog' ? 'blog' : 'shop';

  const [scope, setScope] = useState<Scope>(rawScope);
  const [inputValue, setInputValue] = useState(rawQ);

  useEffect(() => { setScope(rawScope); }, [rawScope]);
  useEffect(() => { setInputValue(rawQ); }, [rawQ]);

  const changeScope = (next: Scope) => {
    router.replace({ pathname: '/search', query: { q: rawQ, scope: next } }, undefined, { shallow: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    router.push({ pathname: '/search', query: { q, scope } });
  };

  const { data: productsData, loading: productsLoading } = useQuery<{ products: { nodes: any[] } }>(SEARCH_PRODUCTS, {
    variables: { search: rawQ, first: 12 },
    skip: !rawQ || scope !== 'shop',
  });

  const { data: postsData, loading: postsLoading } = useQuery<{ posts: { nodes: any[] } }>(SEARCH_POSTS, {
    variables: { query: rawQ, first: 12 },
    skip: !rawQ || scope !== 'blog',
  });

  const rawProducts: any[] = productsData?.products?.nodes ?? [];
  const products: FeaturedProduct[] = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image ?? null,
    price: p.price ?? null,
    regularPrice: p.regularPrice ?? null,
  }));

  const posts: any[] = postsData?.posts?.nodes ?? [];
  const blogItems: BlogGridItem[] = posts.map((p: any) => ({
    id: p.databaseId,
    title: decodeEntities(p.title || ''),
    summary: cleanExcerpt(p.excerpt || '').slice(0, 120),
    imageUrl: pickImage(p, 'medium') || null,
    href: `/blog/${p.slug}`,
  }));

  const isLoading = scope === 'shop' ? productsLoading : postsLoading;

  return (
    <Fragment>
      <SeoHead
        title={rawQ ? `Search: "${rawQ}" — Shamanicca` : 'Search — Shamanicca'}
        description={`Search results for "${rawQ}" on Shamanicca.`}
      />
      <Header />
      <main role="main">
        <div className="main pt-lg-responsive pb-lg-responsive">
          <h1 className="type-4xl mt-0 mb-sm-responsive">
            {rawQ ? <>Results for <em>&ldquo;{rawQ}&rdquo;</em></> : 'Search'}
          </h1>

          {/* Inline search field */}
          <form className="search-page__form mb-md-responsive" onSubmit={handleSearch} role="search">
            <div className="header__search_field">
              <label htmlFor="search-page-input" className="visually-hidden">Search</label>
              <input
                id="search-page-input"
                type="text"
                name="q"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search products or posts"
                autoComplete="off"
              />
              <button type="submit" className="header__search_submit type-bold type-sm type-uppercase">Search</button>
            </div>

            <fieldset className="header__search_scope mt-sm-responsive">
              <legend className="visually-hidden">Search scope</legend>
              <label className="header__search_radio">
                <input type="radio" name="scope" value="shop" checked={scope === 'shop'} onChange={() => changeScope('shop')} />
                <span>Shop</span>
              </label>
              <label className="header__search_radio">
                <input type="radio" name="scope" value="blog" checked={scope === 'blog'} onChange={() => changeScope('blog')} />
                <span>Blog</span>
              </label>
            </fieldset>
          </form>

          {!rawQ && (
            <p className="type-md type-gray-80">Enter a search term to find products and articles.</p>
          )}

          {rawQ && isLoading && (
            <p className="type-md type-gray-80">Searching…</p>
          )}

          {/* Shop results */}
          {rawQ && scope === 'shop' && !productsLoading && (
            products.length === 0
              ? <p className="type-md type-gray-80">No products found for &ldquo;{rawQ}&rdquo;.</p>
              : <ProductsGrid products={products} displayingInHome={false} showTitle={false} showCTA={false} />
          )}

          {/* Blog results */}
          {rawQ && scope === 'blog' && !postsLoading && (
            blogItems.length === 0
              ? <p className="type-md type-gray-80">No articles found for &ldquo;{rawQ}&rdquo;.</p>
              : <BlogGrid items={blogItems} />
          )}
        </div>
        <Footer />
      </main>
    </Fragment>
  );
}
