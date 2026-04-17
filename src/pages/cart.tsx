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
      .map((i) => `${parseInt(i.product.id, 10)}:${i.qty}`)
      .join(',');

    window.location.href = `${WC_BASE}/?headless_checkout=1&items=${itemsParam}`;
  };

  return (
    <Fragment>
      <SeoHead title="Cart — Shamanicca" description="Review your bag before checkout." />
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
                          className="btn btn-link p-0 mt-sm-responsive"
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
