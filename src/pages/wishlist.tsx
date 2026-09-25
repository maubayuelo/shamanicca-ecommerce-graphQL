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
            <div className="wishlist-empty flex flex-col items-center text-center py-[90px] gap-2.5">
              <Image src="/images/icon-heart.svg" alt="" width={48} height={48} className="wishlist-empty__icon opacity-25 mb-2.5" aria-hidden />
              <p className="type-xl type-bold">Your wishlist is empty.</p>
              <p className="type-md type-gray-80">Save items you love and find them here anytime.</p>
              <Link href="/shop" className="btn btn-primary mt-md-responsive">Browse the Shop</Link>
            </div>
          )}

          {hydrated && items.length > 0 && (
            <div className="wishlist-grid grid grid-cols-[1fr] gap-7.5 sm:grid-cols-[repeat(2,1fr)] lg:grid-cols-[repeat(3,1fr)]">
              {items.map((item) => (
                <div key={item.id} className="wishlist-tile flex flex-col gap-legacy-15">
                  <Link href={`/products/${item.slug}`} className="wishlist-tile__image-wrap relative block w-full aspect-square overflow-hidden bg-gray-50 after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:[box-shadow:inset_0_0_0_1px_var(--color-gray-200)] after:pointer-events-none" aria-label={`View ${item.name}`}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="wishlist-tile__placeholder w-full h-full bg-gray-100" />
                    )}
                  </Link>

                  <div className="wishlist-tile__info flex flex-col gap-1">
                    <Link href={`/products/${item.slug}`} className="wishlist-tile__name type-lg type-bold text-black no-underline [&:hover]:text-[#675dff]">
                      {item.name}
                    </Link>
                    <div className="wishlist-tile__price flex gap-2.5 items-center">
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

                  <div className="wishlist-tile__actions flex items-center gap-legacy-15 mt-[5px]">
                    <Link href={`/products/${item.slug}`} className="btn btn-primary btn-small">
                      View Product
                    </Link>
                    <button
                      className="wishlist-tile__remove type-sm [background:none] [border:none] text-gray-500 cursor-pointer [padding:0] underline [text-underline-offset:3px] [transition:color_0.15s] [&:hover]:text-black"
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
