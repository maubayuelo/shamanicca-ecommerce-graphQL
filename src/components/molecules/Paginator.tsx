/**
 * Paginator.tsx — Page navigation for lists (Molecule)
 *
 * Renders numbered page buttons with ellipses (…) for long page ranges.
 * Example: [←] [1] [2] … [5] [6] [7] … [10] [→]
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines Link atoms and button atoms with pagination logic.
 *
 * TWO NAVIGATION MODES:
 *  1. LINK-BASED (SEO-friendly, used in blog/all):
 *     Provide hrefBuilder={(page) => `/blog/all?page=${page}`}
 *     Each page renders as an <a> tag — crawlable by Google.
 *
 *  2. CALLBACK-BASED (client-state, used in shop category):
 *     Provide onPageChange={(page) => setState(page)}
 *     Each page renders as a <button> — no URL change, filters state client-side.
 *
 * PAGE RANGE ALGORITHM (buildPageItems):
 *  Always shows: first N pages, last N pages, and K siblings around the current page.
 *  Gaps between visible ranges are filled with "…" dots.
 *  This is the standard "Google-style" paginator pattern.
 *  - boundaryCount: how many pages to always show at start/end (default 1)
 *  - siblingCount: how many pages to show around the current page (default 1)
 *
 * RESPONSIVE BEHAVIOR:
 *  pageItemsForWidth() (utils/paginationWindow.ts) picks how many pages to show
 *  from window.innerWidth: fixed counts on phones (<= 600px, the list scrolls)
 *  and desktop (>= 1024px), and on tablets the widest window that fits without
 *  clipping. The breakpoints match the SCSS variables ($breakpoint-phone: 600px).
 *
 * ACCESSIBILITY:
 *  - Wrapped in <nav role="navigation" aria-label="Pagination">
 *  - Active page: aria-current="page"
 *  - Disabled prev/next: aria-disabled + tabIndex={-1}
 *  - Screen reader text: "Page N" via <span className="sr-only">
 */

import Link from 'next/link';
import React, { Fragment } from 'react';
import Image from 'next/image';
import { DESKTOP_MIN, pageItemsForWidth } from '../../utils/paginationWindow';

// Shared by every <a>, <button> and <span> inside a page item (the SCSS it
// replaces styled all three with one rule, sr-only spans included). The 600px
// query is exact: the JS in utils/paginationWindow.ts (PHONE_MAX) uses the same
// value, and both move in Phase 9. No font-family: the <button> renders in the
// UA font today.
const PAG_TEXT =
  'inline-flex items-center justify-center min-w-10 [border:0] no-underline text-black py-2.5 px-4 [@media(max-width:600px)]:min-w-8 [@media(max-width:600px)]:p-2 cursor-pointer [transition:background-color_120ms_ease,color_120ms_ease,opacity_120ms_ease]';
// <span>: transparent, and font-size/weight/line-height come from the
// unlayered remnant in paginator.scss (they must beat .type-lg / .type-extrabold).
const PAG_SPAN = `${PAG_TEXT} bg-transparent`;
// <a> and <button>: inherit the item's font, gray on hover (ungated, like the SCSS).
const PAG_CTRL = `${PAG_TEXT} [font-size:inherit] [font-weight:inherit] [line-height:inherit] [&:hover]:bg-gray-50`;
// The dots keep the base min-width but override padding, cursor and opacity.
const PAG_DOTS =
  'inline-flex items-center justify-center min-w-10 [border:0] no-underline text-black py-0 px-legacy-15 [@media(max-width:600px)]:min-w-8 cursor-default opacity-80 [transition:background-color_120ms_ease,color_120ms_ease,opacity_120ms_ease] bg-transparent';
const PAG_ITEM = 'paginator__item mb-0 flex items-center justify-center relative not-first:border-l not-first:border-l-gray-100';
const PAG_LIST =
  'paginator__list inline-flex items-stretch bg-white border border-gray-300 rounded-[10px] [box-shadow:0_3px_6px_-3px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05),0_1px_0_-1px_rgba(0,0,0,0.05)] overflow-hidden [padding:0] [margin:0] list-none [@media(max-width:600px)]:overflow-x-auto [@media(max-width:600px)]:[-webkit-overflow-scrolling:touch]';

export type PaginatorProps = {
  /** 1-based current page */
  currentPage: number;
  /** total number of items */
  totalItems: number;
  /** items per page */
  pageSize: number;
  /** called when user selects a page (used for client state) */
  onPageChange?: (page: number) => void;
  /** if provided, pages will be rendered as Links using this href builder */
  hrefBuilder?: (page: number) => string;
  /** number of page siblings around the current page */
  siblingCount?: number;
  /** number of start/end boundary pages always shown */
  boundaryCount?: number;
  className?: string;
};

/**
 * Responsive, accessible paginator component.
 * - Renders page numbers with ellipses when needed
 * - Supports either callback navigation or Link-based navigation
 */
export default function Paginator({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  hrefBuilder,
  siblingCount = 1,
  boundaryCount = 1,
  className = '',
}: PaginatorProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp current page into valid range
  const page = Math.max(1, Math.min(currentPage, totalPages));

  // The page window follows the viewport width after mount (SSR-safe: null
  // until then). See utils/paginationWindow.ts.
  const viewportWidth = useViewportWidth();

  const items = React.useMemo(
    () => pageItemsForWidth({ totalPages, currentPage: page, width: viewportWidth, siblingCount, boundaryCount }),
    [totalPages, page, viewportWidth, siblingCount, boundaryCount]
  );

  const handleClick = (p: number) => (e: React.MouseEvent) => {
    if (!hrefBuilder) e.preventDefault();
    if (p === page) return; // no-op
    onPageChange?.(p);
  };

  const goPrev = Math.max(1, page - 1);
  const goNext = Math.min(totalPages, page + 1);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className={`paginator w-full flex items-center justify-center ${className}`} aria-label="Pagination" role="navigation">
      <ul className={PAG_LIST} role="list">
        {/* Prev */}
        <li className={`${PAG_ITEM} paginator__prev${prevDisabled ? ' is-disabled' : ''}`}>
          {hrefBuilder ? (
            <Link className={`${PAG_CTRL} bg-transparent${prevDisabled ? ' pointer-events-none opacity-50' : ''}`} aria-disabled={prevDisabled} tabIndex={prevDisabled ? -1 : 0} href={hrefBuilder(goPrev)} onClick={prevDisabled ? undefined : handleClick(goPrev)} aria-label="Previous page">
              <Image src="/images/icon-chevron-left.svg" alt="" aria-hidden width={12} height={21} />
              <span className={`sr-only ${PAG_SPAN}`}>Previous</span>
            </Link>
          ) : (
            <button type="button" className={`${PAG_CTRL} bg-transparent disabled:cursor-default disabled:opacity-60`} aria-label="Previous" disabled={prevDisabled} onClick={handleClick(goPrev)}>
              <Image src="/images/icon-chevron-left.svg" alt="" aria-hidden width={12} height={21} />
            </button>
          )}
        </li>

        {/* Page numbers */}
        {items.map((item, idx) => {
          if (item.type === 'dots') {
            return (
              <li key={`dots-${idx}`} className={`${PAG_ITEM} is-ellipsis`} aria-hidden>
                <span className={`type-lg type-medium ${PAG_DOTS}`}>…</span>
              </li>
            );
          }
          const isActive = item.page === page;
          const content = (
            <Fragment>
              <span className={`sr-only ${PAG_SPAN}`}>Page </span>
              <span className={`type-lg type-extrabold ${PAG_SPAN}`}>{item.page}</span>
            </Fragment>
          );
          return (
            <li key={item.page} className={`${PAG_ITEM}${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
              {hrefBuilder ? (
                <Link className={`${PAG_CTRL} ${isActive ? 'bg-gray-50' : 'bg-transparent'}`} href={hrefBuilder(item.page)} aria-label={`Go to page ${item.page}`} onClick={handleClick(item.page)}>
                  {content}
                </Link>
              ) : (
                <button type="button" className={`${PAG_CTRL} ${isActive ? 'bg-gray-50' : 'bg-transparent'} disabled:cursor-default disabled:opacity-60`} aria-label={`Go to page ${item.page}`} onClick={handleClick(item.page)} disabled={isActive}>
                  {content}
                </button>
              )}
            </li>
          );
        })}

        {/* Next */}
        <li className={`${PAG_ITEM} paginator__next${nextDisabled ? ' is-disabled' : ''}`}>
          {hrefBuilder ? (
            <Link className={`${PAG_CTRL} bg-transparent${nextDisabled ? ' pointer-events-none opacity-50' : ''}`} aria-disabled={nextDisabled} tabIndex={nextDisabled ? -1 : 0} href={hrefBuilder(goNext)} onClick={nextDisabled ? undefined : handleClick(goNext)} aria-label="Next page">
              <Image src="/images/icon-chevron-right.svg" alt="" aria-hidden width={12} height={21} />
              <span className={`sr-only ${PAG_SPAN}`}>Next</span>
            </Link>
          ) : (
            <button type="button" className={`${PAG_CTRL} bg-transparent disabled:cursor-default disabled:opacity-60`} aria-label="Next" disabled={nextDisabled} onClick={handleClick(goNext)}>
              <Image src="/images/icon-chevron-right.svg" alt="" aria-hidden width={12} height={21} />
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}

// Helpers

// Screen-reader only utility if not already present in the design system
// This is a defensive style—actual class is styled in global CSS.
export const __SR_ONLY_CLASS = 'sr-only';

// --- Internals: viewport width

// null on the server and for the first client render (so hydration matches);
// then the window width, kept current on resize.
function useViewportWidth(): number | null {
  const [width, setWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const read = () => setWidth(window.innerWidth || DESKTOP_MIN);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  return width;
}
