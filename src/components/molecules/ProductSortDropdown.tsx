/**
 * ProductSortDropdown.tsx — Product list sort selector (Molecule)
 *
 * A simple <select> dropdown for sorting the product listing.
 * Used in the ProductListing section (shop category pages).
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Wraps a native HTML <select> with a label, type definitions, and styling.
 *
 * CONTROLLED COMPONENT:
 *  The parent component (ProductListing) owns the sort state.
 *  This dropdown just fires onChange → parent updates state → products re-sort.
 *  This is called a "controlled component" — the dropdown reflects whatever
 *  value the parent passes in, and reports changes back up via onChange.
 *
 * SORT OPTIONS (default):
 *  'recent'      — as returned by API (default)
 *  'price-high'  — highest price first
 *  'price-low'   — lowest price first
 *  'newest'      — newest by date
 *  'oldest'      — oldest by date
 *  'rating-high' — best rated first
 *
 * The `options` prop lets the parent override the defaults if needed.
 * Actual sorting logic is in ProductListing, not here.
 *
 * ACCESSIBILITY:
 *  Uses a visually hidden <label> (className="visually-hidden") that is
 *  still read by screen readers but invisible on screen.
 */

import React from 'react';

export type SortOption = {
  value: string;
  label: string;
};

export type ProductSortDropdownProps = {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  options?: SortOption[];
};

const defaultOptions: SortOption[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'rating-high', label: 'Best Rated' },
];

export default function ProductSortDropdown({ value = 'recent', onChange, className = '', options = defaultOptions }: ProductSortDropdownProps) {
  return (
    <div className={`product-sort ${className}`}>
      <label htmlFor="product-sort" className="visually-hidden">Sort products</label>
      <select
        id="product-sort"
        name="product-sort"
        className="form-control form-control--condensed product-sort__select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Sort products"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
