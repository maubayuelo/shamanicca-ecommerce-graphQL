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
