/**
 * Which page numbers the Paginator shows.
 *
 * buildPageItems is the window algorithm (first/last "boundary" pages, "sibling"
 * pages around the current one, an ellipsis for each gap). pageItemsForWidth
 * picks its counts from the viewport width:
 *
 *  - phone (<= 600px): the fixed counts the component always used (the list
 *    scrolls there);
 *  - tablet (601-1023px) and desktop (>= 1024px): the list cannot scroll
 *    (overflow: hidden) and its cells are large, so the widest window that FITS
 *    the container is used, measured with the cell widths below. A full list of
 *    6-7 pages is ~775-825px wide; the container is `width - 30` on a tablet,
 *    `width - 60` on desktop and only `width - 570` next to the blog sidebar.
 *    Desktop keeps its usual window (2 siblings, 2 boundary pages) whenever
 *    that fits, and falls back through the tablet candidates only when it
 *    does not.
 *
 * Keep the two 600 / 1024 values in sync with the SCSS breakpoints (the 600px
 * query in Paginator.tsx is exact; both move in Phase 9).
 */

export type PageItem = { type: 'page'; page: number } | { type: 'dots' };

export function buildPageItems({
  totalPages,
  currentPage,
  siblingCount,
  boundaryCount,
}: {
  totalPages: number;
  currentPage: number;
  siblingCount: number;
  boundaryCount: number;
}): PageItem[] {
  const items: PageItem[] = [];
  if (totalPages <= 1) return [{ type: 'page', page: 1 }];

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages);

  const leftSiblingStart = Math.max(
    Math.min(currentPage - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const rightSiblingEnd = Math.min(
    Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1
  );

  // Start pages
  startPages.forEach((p) => items.push({ type: 'page', page: p }));

  // Left dots
  if (leftSiblingStart > boundaryCount + 2) {
    items.push({ type: 'dots' });
  } else if (boundaryCount + 1 < totalPages - boundaryCount) {
    items.push({ type: 'page', page: boundaryCount + 1 });
  }

  // Middle pages
  for (let p = leftSiblingStart; p <= rightSiblingEnd; p++) {
    items.push({ type: 'page', page: p });
  }

  // Right dots
  if (rightSiblingEnd < totalPages - boundaryCount - 1) {
    items.push({ type: 'dots' });
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push({ type: 'page', page: totalPages - boundaryCount });
  }

  // End pages
  endPages.forEach((p) => items.push({ type: 'page', page: p }));

  // Deduplicate while preserving order
  const seen = new Set<number>();
  const final: PageItem[] = [];
  for (const it of items) {
    if (it.type === 'dots') {
      if (final[final.length - 1]?.type !== 'dots') final.push(it);
    } else if (!seen.has(it.page)) {
      seen.add(it.page);
      final.push(it);
    }
  }
  return final;
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export const PHONE_MAX = 600; // $breakpoint-phone
export const DESKTOP_MIN = 1024; // $breakpoint-desktop

// Tablet cell widths in px, measured on /blog/all (the anchor variant, whose
// prev/next carry an sr-only span; the button variant is narrower, so this
// errs on the safe side). Re-measure if the PAG_* classes in Paginator.tsx
// change.
export const TABLET_CELL = {
  number: 105,
  dots: 71,
  prev: 72,
  next: 73,
  listBorder: 2,
  // viewport width minus the page gutters (`.main` padding, 15px each side)
  gutter: 30,
} as const;

/** The counts used outside the tablet range (exactly the previous behaviour). */
export function fixedCounts(width: number, siblingCount: number, boundaryCount: number) {
  if (width <= PHONE_MAX) {
    return { siblingCount: Math.min(0, siblingCount), boundaryCount: Math.min(1, boundaryCount) };
  }
  if (width < DESKTOP_MIN) {
    return { siblingCount: Math.max(1, siblingCount), boundaryCount: Math.max(1, boundaryCount) };
  }
  return { siblingCount: Math.max(2, siblingCount), boundaryCount: Math.max(2, boundaryCount) };
}

/** Pixel width of the rendered list for `items` (prev + items + next + border). */
export function listWidth(items: PageItem[]): number {
  let w = TABLET_CELL.prev + TABLET_CELL.next + TABLET_CELL.listBorder;
  for (const it of items) w += it.type === 'page' ? TABLET_CELL.number : TABLET_CELL.dots;
  return w;
}

/** Widest list any current page produces for these counts. */
export function worstListWidth(totalPages: number, siblingCount: number, boundaryCount: number): number {
  let worst = 0;
  for (let cur = 1; cur <= totalPages; cur++) {
    worst = Math.max(worst, listWidth(buildPageItems({ totalPages, currentPage: cur, siblingCount, boundaryCount })));
  }
  return worst;
}

type Counts = { siblingCount: number; boundaryCount: number };

/** Window candidates, widest first (siblings + boundary > boundary > siblings > current only). */
function candidatesFor(siblingCount: number, boundaryCount: number): Counts[] {
  const s = Math.max(1, siblingCount);
  const b = Math.max(1, boundaryCount);
  return [
    { siblingCount: s, boundaryCount: b },
    { siblingCount: 0, boundaryCount: b },
    { siblingCount: s, boundaryCount: 0 },
    { siblingCount: 0, boundaryCount: 0 },
  ];
}

/**
 * The first candidate whose WORST case over every current page fits `room`
 * (so the window keeps one shape while paging). The last candidate (only the
 * current page between two ellipses) is 394px wide.
 */
export function firstFitting(room: number, totalPages: number, candidates: Counts[]): Counts {
  for (const c of candidates) {
    if (worstListWidth(totalPages, c.siblingCount, c.boundaryCount) <= room) return c;
  }
  return candidates[candidates.length - 1];
}

/** The tablet window (601-1023px) for a viewport `width` (container = width - gutter). */
export function tabletCounts(width: number, totalPages: number, siblingCount: number, boundaryCount: number) {
  return firstFitting(width - TABLET_CELL.gutter, totalPages, candidatesFor(siblingCount, boundaryCount));
}

/**
 * The page items for a viewport width. `width` is null until the first client
 * render (server and first paint use the props, as before). `container` is the
 * measured width available to the list, or null when it is not known yet
 * (tablet then uses `width - gutter`; desktop keeps its usual window).
 */
export function pageItemsForWidth({
  totalPages,
  currentPage,
  width,
  siblingCount,
  boundaryCount,
  container = null,
}: {
  totalPages: number;
  currentPage: number;
  width: number | null;
  siblingCount: number;
  boundaryCount: number;
  container?: number | null;
}): PageItem[] {
  let counts: Counts = { siblingCount, boundaryCount };
  if (width !== null) {
    if (width <= PHONE_MAX) {
      counts = fixedCounts(width, siblingCount, boundaryCount);
    } else if (width < DESKTOP_MIN) {
      counts = firstFitting(container ?? width - TABLET_CELL.gutter, totalPages, candidatesFor(siblingCount, boundaryCount));
    } else {
      const usual = fixedCounts(width, siblingCount, boundaryCount);
      counts =
        container === null
          ? usual
          : firstFitting(container, totalPages, [usual, ...candidatesFor(siblingCount, boundaryCount)]);
    }
  }
  return buildPageItems({ totalPages, currentPage, ...counts });
}
