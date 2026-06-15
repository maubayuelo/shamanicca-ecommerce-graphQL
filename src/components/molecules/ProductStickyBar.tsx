/**
 * ProductStickyBar.tsx — Sticky "Add to Bag" bar for product pages (Molecule)
 *
 * A fixed bar that sticks to the bottom of the viewport showing the product
 * name, price, and an "Add to Bag" button.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines product info (name, price) with an action button in a fixed layout.
 *
 * WHY THIS EXISTS:
 *  On mobile, the main product detail section (name, price, Add to Bag button)
 *  can scroll far off screen when reading the product description.
 *  This bar ensures the CTA is always reachable without scrolling back up.
 *
 * CONTROLLED VISIBILITY:
 *  `visible` is controlled by the parent (ProductPage).
 *  The parent uses IntersectionObserver to watch the main CTA button:
 *    - When the main button is NOT visible → visible: true (bar appears)
 *    - When the main button IS visible    → visible: false (bar disappears)
 *  This means the bar only shows when you actually need it.
 *
 * RETURNS NULL WHEN HIDDEN:
 *  `if (!visible) return null` means the component is completely removed from
 *  the DOM when not needed. This is more efficient than CSS `display: none`
 *  because React doesn't render it at all.
 *
 * PROPS:
 *  name         — product title displayed in the bar
 *  price        — current price (number, shown as "$XX.XX")
 *  regularPrice — optional, shown strikethrough when on sale
 *  isOnSale     — toggles the strikethrough on regularPrice
 *  isOutOfStock — disables the button and shows "Out of Stock"
 *  onAddToBag   — same handler as the main page button (adds to cart + redirects)
 */

'use client';
import React from 'react';

type Props = {
  name: string;
  price: number;
  regularPrice?: number;
  isOnSale?: boolean;
  isOutOfStock?: boolean;
  visible: boolean;
  onAddToBag: () => void;
};

export default function ProductStickyBar({
  name,
  price,
  regularPrice,
  isOnSale,
  isOutOfStock,
  visible,
  onAddToBag,
}: Props) {
  if (!visible) return null;

  return (
    <div className="product-sticky-bar" role="region" aria-label="Quick add to bag">
      <div className="product-sticky-bar__inner">
        <div className="product-sticky-bar__info">
          <span className="product-sticky-bar__name type-md type-bold">{name}</span>
          <div className="product-sticky-bar__price">
            {isOnSale && regularPrice && (
              <span className="product-sticky-bar__price--compare type-sm">
                ${regularPrice.toFixed(2)}
              </span>
            )}
            <span className="product-sticky-bar__price--current type-md type-bold">
              ${price.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={onAddToBag}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
