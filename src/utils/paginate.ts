/**
 * Paging for the blog listings (Phase: blog pagination fix).
 *
 * WordPress keeps a curated post order that WPGraphQL's `orderby` does not
 * change, while WPGraphQL cursors filter by date. Walking cursors therefore
 * repeats posts and skips others. The listings instead load every post id in
 * the site's own order (one request) and slice pages here.
 */

// WPGraphQL returns at most 100 nodes per request.
export const MAX_LISTING_IDS = 100;

/**
 * The listing's `?page=` value: a positive integer, else page 1. This is
 * the parsing the routes always had (parseInt semantics: "2abc" is 2,
 * "1.5" and "1e1" are 1, a repeated `?page=` arrives as an array and is 1).
 */
export function parsePageParam(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Slice `ids` into pages. A page past the last one is not clamped: it has no
 * ids (the route renders an empty grid, as it always did).
 */
export function paginateIds<T>(
  ids: readonly T[],
  page: unknown,
  perPage: number,
): { pageIds: T[]; totalPages: number; currentPage: number } {
  const size = Math.max(1, Math.floor(Number(perPage)) || 1);
  const currentPage = typeof page === 'number' ? (Number.isInteger(page) && page > 0 ? page : 1) : parsePageParam(page);
  const start = (currentPage - 1) * size;
  return {
    pageIds: ids.slice(start, start + size),
    totalPages: Math.ceil(ids.length / size),
    currentPage,
  };
}

/** Warns when a listing may be truncated by the per-request cap. */
export function warnIfTruncated(count: number, label: string): void {
  if (count >= MAX_LISTING_IDS) {
    console.warn(`[blog] ${label}: the ids query returned ${count} nodes (the per-request cap); the listing may be truncated.`);
  }
}
