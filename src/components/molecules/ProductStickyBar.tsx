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
    <div className="product-sticky-bar fixed bottom-0 left-0 right-0 z-[8000] bg-white border-t border-t-gray-200 [box-shadow:0_-4px_24px_rgba(0,0,0,.08)] animate-[sticky-bar-slide-up_350ms_cubic-bezier(.16,1,.3,1)_both]" role="region" aria-label="Quick add to bag">
      <div className="product-sticky-bar__inner flex items-center justify-between gap-5 box-border w-full my-0 mx-auto p-legacy-15 lg:px-7.5 xl:max-w-350 max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5">
        <div className="product-sticky-bar__info flex flex-col gap-0.5 min-w-0 max-sm:flex-row max-sm:justify-between max-sm:items-center">
          <span className="product-sticky-bar__name type-md type-bold text-black truncate max-w-85 max-sm:max-w-[60%]">{name}</span>
          <div className="product-sticky-bar__price flex items-center gap-2.5">
            {isOnSale && regularPrice && (
              <span className="product-sticky-bar__price--compare type-sm text-gray-500 line-through">
                ${regularPrice.toFixed(2)}
              </span>
            )}
            <span className="product-sticky-bar__price--current type-md type-bold text-black">
              ${price.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          className="btn btn-primary max-sm:w-full"
          onClick={onAddToBag}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
