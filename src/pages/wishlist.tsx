/**
 * wishlist.tsx — Saved products page (route: /wishlist)
 *
 * Displays items the user saved with the heart icon on product pages.
 *
 * DATA SOURCE:
 * All data comes from WishlistContext (React Context + localStorage).
 * Like the cart, there is no server-side data fetching — fully client-side.
 *
 * HYDRATION GUARD:
 * Shows "Loading…" until `hydrated` is true (after localStorage is read on client).
 *
 * EMPTY STATE:
 * When the wishlist has no items, shows a large heart icon + link to /shop.
 * Good UX practice — never leave the user on a dead-end empty page.
 *
 * PRODUCT TILE:
 * Each saved item shows: image, name, price (with strikethrough if on sale),
 * a "View Product" link to the product detail page, and a "Remove" button.
 *
 * PRICE DISPLAY:
 * regularPrice is shown with strikethrough only if it is:
 *  - A valid finite number (`Number.isFinite`)
 *  - Greater than the current price (i.e., there is actually a discount)
 * This prevents displaying $0.00 or NaN if data is missing.
 *
 * LAYOUT:
 * A CSS grid (wishlist-grid) that adapts from 1 column (mobile) to 3-4 columns (desktop).
 */

import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import Breadcrumb from '../components/molecules/Breadcrumb';
import { useWishlist } from '../lib/context/wishlist';

export default function WishlistPage() {
  const { items, removeItem, hydrated } = useWishlist();

  return (
    <Fragment>
      <SeoHead title="Wishlist — Shamanicca" description="Your saved Shamanicca products." />
      <Header />
      <main role="main">
        <div className="main pt-lg-responsive pb-xl-responsive">
          <Breadcrumb items={[{ label: 'Shop', href: '/shop' }, { label: 'Wishlist' }]} />

          <h1 className="type-5xl type-extrabold mt-sm-responsive mb-lg-responsive">Wishlist</h1>

          {!hydrated && (
            <p className="type-md type-gray-80">Loading…</p>
          )}

          {hydrated && items.length === 0 && (
            <div className="wishlist-empty">
              <Image src="/images/icon-heart.svg" alt="" width={48} height={48} className="wishlist-empty__icon" aria-hidden />
              <p className="type-xl type-bold">Your wishlist is empty.</p>
              <p className="type-md type-gray-80">Save items you love and find them here anytime.</p>
              <Link href="/shop" className="btn btn-primary mt-md-responsive">Browse the Shop</Link>
            </div>
          )}

          {hydrated && items.length > 0 && (
            <div className="wishlist-grid">
              {items.map((item) => (
                <div key={item.id} className="wishlist-tile">
                  <Link href={`/products/${item.slug}`} className="wishlist-tile__image-wrap" aria-label={`View ${item.name}`}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="wishlist-tile__placeholder" />
                    )}
                  </Link>

                  <div className="wishlist-tile__info">
                    <Link href={`/products/${item.slug}`} className="wishlist-tile__name type-lg type-bold">
                      {item.name}
                    </Link>
                    <div className="wishlist-tile__price">
                      {item.regularPrice && Number.isFinite(item.regularPrice) && item.regularPrice > item.price && (
                        <span className="type-md type-gray-60" style={{ textDecoration: 'line-through' }}>
                          ${item.regularPrice.toFixed(2)}
                        </span>
                      )}
                      {Number.isFinite(item.price) && item.price > 0 && (
                        <span className="type-md type-bold">${item.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="wishlist-tile__actions">
                    <Link href={`/products/${item.slug}`} className="btn btn-primary btn-small">
                      View Product
                    </Link>
                    <button
                      className="wishlist-tile__remove type-sm"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}
