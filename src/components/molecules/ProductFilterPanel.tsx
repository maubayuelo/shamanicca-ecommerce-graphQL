/**
 * ProductFilterPanel.tsx — Product filtering side panel (Molecule)
 *
 * A slide-in panel with checkboxes for filtering products by category and price range.
 * Triggered by the "Filter" button in the ProductListing section.
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines checkbox inputs, buttons, and a backdrop into a dialog component.
 *
 * CONTROLLED COMPONENT PATTERN:
 *  - isOpen: controlled externally by the parent (ProductListing)
 *  - onClose: called when user clicks the backdrop, close button, or presses Escape
 *  - onApply: called when user clicks "Apply" — receives the selected FilterValues
 *
 * FILTER STATE:
 *  Internal state `values` tracks checked items as arrays of strings.
 *  The `toggle()` function uses a JavaScript Set to add/remove items efficiently:
 *    Set is like an array but automatically prevents duplicates.
 *    set.has(key) → true/false
 *    set.add(key) → adds
 *    set.delete(key) → removes
 *    Array.from(set) → converts back to array for storage in state
 *
 * PRICE RANGES:
 *  Stored as strings: '<25', '25-50', '50-100', '>100'
 *  The actual filtering logic lives in ProductListing where products are filtered
 *  against these range strings.
 *
 * ACCESSIBILITY:
 *  - role="dialog" + aria-modal="true" for screen readers
 *  - Escape key closes the panel (keyboard trap alternative)
 *  - Filter groups use <fieldset> + <legend> for semantic grouping
 */

import React from 'react';

export type ProductFilterValues = {
  categories: string[];
  priceRanges: string[]; // e.g., '<25', '25-50', '50-100', '>100'
};

export type ProductFilterPanelProps = {
  isOpen: boolean;
  onClose?: () => void;
  onApply?: (values: ProductFilterValues) => void;
  className?: string;
};

const defaultValues: ProductFilterValues = {
  categories: [],
  priceRanges: [],
};

export default function ProductFilterPanel({ isOpen, onClose, onApply, className = '' }: ProductFilterPanelProps) {
  const [values, setValues] = React.useState<ProductFilterValues>(defaultValues);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const toggle = (group: keyof ProductFilterValues, key: string) => {
    setValues((prev) => {
      const set = new Set(prev[group]);
      if (set.has(key)) set.delete(key); else set.add(key);
      return { ...prev, [group]: Array.from(set) };
    });
  };

  const handleApply = () => {
    onApply?.(values);
    onClose?.();
  };

  const handleClear = () => {
    setValues(defaultValues);
  };

  return (
    <div className={`product-filter ${isOpen ? 'is-open' : ''} ${className}`} role="dialog" aria-modal="true" aria-labelledby="product-filter-title">
      <div className="product-filter__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="product-filter__inner pt-sm-responsive pb-md-responsive">
        <div className="product-filter__header">
          <h2 id="product-filter-title" className="type-md type-extrabold m-0 type-uppercase">Filters</h2>
          <button className="product-filter__close" aria-label="Close filters" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/icon-close.svg" alt="" aria-hidden="true" />
            <span className="visually-hidden">Close</span>
          </button>
        </div>

        <div className="product-filter__grid">
          <fieldset className="product-filter__group">
            <legend className="type-bold">Category</legend>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('categories', 'apparel')} /> Apparel</label>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('categories', 'audibles')} /> Audibles</label>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('categories', 'accessories')} /> Accessories</label>
          </fieldset>

          <fieldset className="product-filter__group">
            <legend className="type-bold">Price</legend>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('priceRanges', '<25')} /> Under $25</label>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('priceRanges', '25-50')} /> $25 – $50</label>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('priceRanges', '50-100')} /> $50 – $100</label>
            <label className="product-filter__check"><input type="checkbox" onChange={() => toggle('priceRanges', '>100')} /> Over $100</label>
          </fieldset>
        </div>

        <div className="product-filter__actions mt-md-responsive">
          <button className="btn btn-secondary btn-small" onClick={handleClear}>Clear</button>
          <button className="btn btn-primary btn-small" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
