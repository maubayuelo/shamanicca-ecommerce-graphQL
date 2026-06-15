/**
 * Breadcrumb.tsx — Navigation path indicator (Molecule)
 *
 * Shows the user's current location in the site hierarchy.
 * Example: Home › Women › Hoodies › My Product
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines Link (atom) with separator and aria attributes.
 *
 * ACCESSIBILITY:
 * - Wrapped in a <nav> with aria-label="Breadcrumb"
 * - The last item gets aria-current="page" (tells screen readers it's the current page)
 * - Separators use aria-hidden="true" so screen readers skip them
 *
 * PROPS:
 *  items[]     — array of { label, href?, ariaLabel? }
 *                If href is omitted, the item renders as plain text (not a link)
 *  linkLast    — if true, the last item is also rendered as a link (useful on product
 *                pages where you want the product name to be linkable)
 *  separator   — defaults to a CSS-styled span; can be customized (e.g. " / " or " > ")
 *
 * ENCODING:
 * WordPress category names can contain HTML entities (e.g. &amp;, &#8217;).
 * decodeEntities() converts them to readable characters before rendering.
 */

import Link from 'next/link';
import React from 'react';
import { decodeEntities } from '../../utils/html';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  ariaLabel?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  ariaLabel?: string;
  linkLast?: boolean;
};

export default function Breadcrumb({
  items,
  className='breadcrumb type-xs',
  separator = <span className="sep" aria-hidden="true" />,
  ariaLabel = 'Breadcrumb',
  linkLast = false,
}: BreadcrumbProps) {
  return (
    <nav className={className ?? 'breadcrumb '} aria-label={ariaLabel}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const shouldLink = item.href && (!isLast || linkLast);
        const label = decodeEntities(item.label);
        const node = shouldLink ? (
          <Link href={item.href} aria-label={item.ariaLabel ?? label}>{label}</Link>
        ) : (
          <span aria-current={isLast ? 'page' : undefined}>{label}</span>
        );

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {node}
            {!isLast && separator}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
