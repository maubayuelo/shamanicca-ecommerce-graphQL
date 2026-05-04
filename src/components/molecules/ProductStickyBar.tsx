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
