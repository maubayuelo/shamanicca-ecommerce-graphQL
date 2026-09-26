/**
 * search.tsx — Search results page (route: /search?q=...&scope=...)
 *
 * A client-side search page that queries WPGraphQL for products or blog posts.
 *
 * URL PARAMETERS:
 *  q     — the search term (e.g. /search?q=hoodie)
 *  scope — 'shop' (products) or 'blog' (articles), defaults to 'shop'
 *
 * HOW SEARCH WORKS:
 * Unlike most pages that use getStaticProps (server-side at build time),
 * search results are fetched 100% in the browser using Apollo's useQuery hook.
 * This is because the query changes on every search term — we can't pre-build
 * all possible search results at deploy time.
 *
 *  - SEARCH_PRODUCTS query → searches WooCommerce products via WPGraphQL
 *  - SEARCH_POSTS query    → searches WordPress blog posts via WPGraphQL
 *  - `skip: !rawQ || scope !== 'shop'` → Apollo skips the query entirely
 *    when there is no search term or when searching a different scope.
 *    This prevents unnecessary API calls.
 *
 * SCOPE SWITCHING:
 * The "Shop" / "Blog" radio toggles update the URL using `router.replace()` with
 * `{ shallow: true }` — this updates the URL without re-running getStaticProps,
 * which is what we want here (the page has no server-side data to re-fetch).
 *
 * RESULTS DISPLAY:
 *  - Shop results → ProductsGrid (same component as homepage featured products)
 *  - Blog results → BlogGrid (same component as blog listing)
 * This reuse keeps the UI consistent across the app.
 *
 * EMPTY / LOADING STATES:
 *  - No query → "Enter a search term..."
 *  - Loading  → "Searching…"
 *  - No results → "No products found for '...'"
 */

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
    imageUrl: pickImage(p, 'thumbnail') || null,
    imageUrlMedium: pickImage(p, 'medium') || null,
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
        <div className="main pt-lg-responsive pb-md-responsive">
          <h1 className="type-4xl mt-0 mb-sm-responsive">
            {rawQ ? <>Results for <em>&ldquo;{rawQ}&rdquo;</em></> : 'Search'}
          </h1>

          {/* Inline search field */}
          <form className="search-page__form mb-md-responsive" onSubmit={handleSearch} role="search">
            <div className="header__search_field grid grid-cols-[1fr_auto] items-center w-full">
              <label htmlFor="search-page-input" className="visually-hidden">Search</label>
              <input
                id="search-page-input"
                type="text"
                name="q"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search products or posts"
                autoComplete="off"
                className="[font-family:Poppins,sans-serif] text-[14px] leading-6 p-[15px] flex-1 bg-white border border-gray-300 border-r-0 rounded-[10px_0_0_10px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-gray-500 [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:[&::placeholder]:text-gray-500"
              />
              <button type="submit" className="header__search_submit type-bold type-sm type-uppercase [border:2px_solid_transparent] cursor-pointer whitespace-nowrap [transition:opacity_0.2s_ease,transform_0.05s_ease-in-out,background-color_0.2s_ease] bg-[#675dff] text-white p-[15px_30px] rounded-[0_10px_10px_0] [&:hover]:bg-black [&:active]:bg-black [&:hover]:border-white [&:active]:border-white [&:hover]:[text-decoration:none] [&:active]:[text-decoration:none] [.search-page__form_&:hover]:border-[#675dff] [.search-page__form_&:active]:border-[#675dff]">Search</button>
            </div>

            <fieldset className="header__search_scope flex gap-legacy-15 border-0 [margin:0] [padding:0] mt-[15px]">
              <legend className="visually-hidden">Search scope</legend>
              <label className="header__search_radio inline-flex items-center gap-1.25 text-black">
                <input type="radio" name="scope" value="shop" checked={scope === 'shop'} onChange={() => changeScope('shop')} className="[accent-color:#675dff] [margin:0]" />
                <span>Shop</span>
              </label>
              <label className="header__search_radio inline-flex items-center gap-1.25 text-black">
                <input type="radio" name="scope" value="blog" checked={scope === 'blog'} onChange={() => changeScope('blog')} className="[accent-color:#675dff] [margin:0]" />
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

          {/* Empty states stay inside the header .main */}
          {rawQ && scope === 'shop' && !productsLoading && products.length === 0 && (
            <p className="type-md type-gray-80">No products found for &ldquo;{rawQ}&rdquo;.</p>
          )}
          {rawQ && scope === 'blog' && !postsLoading && blogItems.length === 0 && (
            <p className="type-md type-gray-80">No articles found for &ldquo;{rawQ}&rdquo;.</p>
          )}
        </div>

        {/* Results grids — each manages its own .main container width */}
        {rawQ && scope === 'shop' && !productsLoading && products.length > 0 && (
          <ProductsGrid products={products} displayingInHome={false} showTitle={false} showCTA={false} />
        )}
        {rawQ && scope === 'blog' && !postsLoading && blogItems.length > 0 && (
          <BlogGrid items={blogItems} className="main pb-lg-responsive" />
        )}

        <Footer />
      </main>
    </Fragment>
  );
}
