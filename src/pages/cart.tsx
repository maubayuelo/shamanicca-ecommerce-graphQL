/**
 * cart.tsx — Shopping cart page (route: /cart)
 *
 * Displays the items in the user's cart with quantity controls
 * and a "Checkout" button that redirects to WooCommerce.
 *
 * DATA SOURCE:
 * All cart data comes from CartContext (React Context + localStorage).
 * There is no server-side data fetching on this page — everything is client-side.
 * This is why the page is NOT using getStaticProps or getServerSideProps.
 *
 * HYDRATION GUARD:
 * `hasHydrated` starts false (SSR renders an empty cart). After the browser loads
 * the page and reads localStorage, it becomes true. We show "Loading your bag…"
 * until hydrated to prevent a flash of "empty cart" on first load.
 *
 * CHECKOUT FLOW:
 * Clicking "Checkout" does NOT open a Stripe modal or a separate checkout page.
 * Instead it redirects to WooCommerce with cart data encoded in the URL:
 *
 *   https://master.shamanicca.com/?headless_checkout=1&items=123:2:M,456:1
 *                                   ↑ custom WP endpoint    ↑ productId:qty:size
 *
 * WooCommerce reads these params, adds the items to its own cart session,
 * and presents the user with the native WC checkout form.
 * After purchase, WooCommerce sets the `shamanicca_order_complete` cookie
 * which CartContext detects to clear the React cart.
 *
 * QUANTITY CONTROLS:
 *  - Minus button: calls updateQty(key, qty - 1), minimum 1
 *  - Plus button: calls updateQty(key, qty + 1)
 *  - Number input: allows typing a quantity directly
 *  - Remove: calls removeItem(key) which removes the item entirely
 *
 * SEO: noRobots={true} — this page should NOT be indexed by search engines.
 * There's no useful public content on a cart page.
 */

import React, { Fragment, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';
import SeoHead from '../components/atoms/SeoHead';
import { useCart } from '../lib/context/cart';

export default function CartPage() {
  const { items, removeItem, updateQty, hydrated: hasHydrated } = useCart();
  const subtotal = hasHydrated
    ? items.reduce((acc, i) => acc + i.qty * (i.product.price ?? 0), 0)
    : 0;

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = () => {
    if (!hasHydrated || items.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');

    const WC_BASE = (process.env.NEXT_PUBLIC_WC_STORE_URL || 'https://master.shamanicca.com').replace(/\/$/, '');
    const itemsParam = items
      .map((i) => {
        const base = `${parseInt(i.product.id, 10)}:${i.qty}`;
        return i.options?.size ? `${base}:${i.options.size}` : base;
      })
      .join(',');

    window.location.href = `${WC_BASE}/?headless_checkout=1&items=${itemsParam}`;
  };

  return (
    <Fragment>
      <SeoHead title="Cart — Shamanicca" description="Review your bag before checkout." noRobots />
      <Header />
      <main className="cart-page" role="main">
        <div className="main pb-lg-responsive pt-lg-responsive">
          <h1 className="type-3xl mt-0 mb-sm-responsive">Your Bag</h1>
          {!hasHydrated ? (
            <div className="cart__loading">Loading your bag…</div>
          ) : items.length === 0 ? (
            <div className="cart__empty">
              <p>Your bag is empty.</p>
              <Link href="/" className="btn btn-secondary mt-sm-responsive">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="cart__layout">
              <ul className="cart__items">
                {items.map((i) => (
                  <li key={i.key} className="cart__item">
                    <div className="cart__thumb">
                      {i.product.image?.sourceUrl ? (
                        <Image
                          src={i.product.image.sourceUrl}
                          alt={i.product.name}
                          width={96}
                          height={96}
                        />
                      ) : (
                        <div className="cart__thumb_placeholder" aria-hidden />
                      )}
                    </div>
                    <div className="cart__info">
                      <Link
                        href={`/products/${i.product.slug}`}
                        className="product-name type-bold"
                      >
                        {i.product.name}
                      </Link>
                      {i.options?.size && (
                        <div className="cart__opt">Size: {i.options.size}</div>
                      )}
                      <div className="prices">
                        <span className="price type-bold">
                          ${i.product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="cart__controls">
                      <div className="cart__qty">
                        <button
                          className="btn btn-secondary btn-small cart__qty_btn"
                          onClick={() => updateQty(i.key, Math.max(1, i.qty - 1))}
                          aria-label="Decrease quantity"
                          disabled={i.qty <= 1}
                        >
                          <Image
                            src="/images/icon-minus.svg"
                            alt="Minus"
                            width={16}
                            height={16}
                          />
                        </button>

                        <input
                          id={`qty-${i.key}`}
                          className="form-control cart__qty_input"
                          type="number"
                          min={1}
                          value={i.qty}
                          onChange={(e) =>
                            updateQty(i.key, Math.max(1, Number(e.target.value) || 1))
                          }
                          aria-label={`Quantity for ${i.product.name}`}
                        />

                        <button
                          className="btn btn-secondary btn-small cart__qty_btn"
                          onClick={() => updateQty(i.key, i.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="cart__actions">
                        <button
                          className="btn btn-muted btn-small mt-sm-responsive"
                          onClick={() => removeItem(i.key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <aside className="cart__summary">
                <div className="cart__row">
                  <span>Subtotal</span>
                  <span className="type-bold">${subtotal.toFixed(2)}</span>
                </div>
                <p className="type-sm">Taxes and shipping calculated at checkout.</p>

                {checkoutError && (
                  <p className="type-sm" style={{ color: '#991b1b' }} role="alert">
                    {checkoutError}
                  </p>
                )}

                <button
                  className="btn btn-primary btn-large"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !hasHydrated || items.length === 0}
                >
                  {checkoutLoading ? 'Redirecting…' : 'Checkout'}
                </button>
              </aside>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </Fragment>
  );
}
