import { describe, expect, it, vi } from 'vitest';
import { MAX_LISTING_IDS, paginateIds, parsePageParam, warnIfTruncated } from './paginate';

const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('paginateIds', () => {
  it('returns the first page in order', () => {
    expect(paginateIds(ids(51), 1, 9)).toEqual({ pageIds: [1, 2, 3, 4, 5, 6, 7, 8, 9], totalPages: 6, currentPage: 1 });
  });

  it('returns a middle page', () => {
    expect(paginateIds(ids(51), 2, 9).pageIds).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });

  it('returns a partial last page', () => {
    expect(paginateIds(ids(51), 6, 9)).toEqual({ pageIds: [46, 47, 48, 49, 50, 51], totalPages: 6, currentPage: 6 });
  });

  it('shows every id exactly once across all pages', () => {
    const pages = [1, 2, 3, 4, 5, 6].flatMap((p) => paginateIds(ids(51), p, 9).pageIds);
    expect(pages).toEqual(ids(51));
  });

  it('has exactly one full page when the count equals the page size', () => {
    expect(paginateIds(ids(12), 1, 12)).toMatchObject({ totalPages: 1, pageIds: ids(12) });
    expect(paginateIds(ids(12), 2, 12).pageIds).toEqual([]);
  });

  it('treats page 0, negative and fractional pages as page 1', () => {
    for (const bad of [0, -1, -100, 1.5, NaN, Infinity]) {
      expect(paginateIds(ids(20), bad, 9)).toMatchObject({ currentPage: 1, pageIds: ids(9) });
    }
  });

  it('treats non-number and unparseable pages as page 1', () => {
    for (const bad of [undefined, null, 'abc', '', {}, [], ['2', '3']]) {
      expect(paginateIds(ids(20), bad, 9).currentPage).toBe(1);
    }
  });

  it('parses numeric strings like the routes always did', () => {
    expect(paginateIds(ids(20), '2', 9).currentPage).toBe(2);
    expect(paginateIds(ids(20), '2abc', 9).currentPage).toBe(2);
    expect(paginateIds(ids(20), '02', 9).currentPage).toBe(2);
    expect(paginateIds(ids(20), '1.5', 9).currentPage).toBe(1);
    expect(paginateIds(ids(20), '1e1', 9).currentPage).toBe(1);
    expect(paginateIds(ids(20), '-3', 9).currentPage).toBe(1);
  });

  it('returns no ids (not the last page) beyond the last page', () => {
    expect(paginateIds(ids(51), 7, 9)).toEqual({ pageIds: [], totalPages: 6, currentPage: 7 });
    expect(paginateIds(ids(51), 999, 9).pageIds).toEqual([]);
  });

  it('handles an empty list', () => {
    expect(paginateIds([], 1, 9)).toEqual({ pageIds: [], totalPages: 0, currentPage: 1 });
  });

  it('guards a non-positive page size', () => {
    expect(paginateIds(ids(3), 1, 0).pageIds).toEqual([1]);
    expect(paginateIds(ids(3), 1, -5).pageIds).toEqual([1]);
  });

  it('does not mutate the input', () => {
    const input = ids(10);
    paginateIds(input, 2, 3);
    expect(input).toEqual(ids(10));
  });
});

describe('parsePageParam', () => {
  it('returns page 1 for anything that is not a positive integer string', () => {
    for (const bad of [undefined, null, 0, 1, '0', '-1', 'abc', '', ['2'], {}]) {
      expect(parsePageParam(bad)).toBe(1);
    }
  });

  it('parses a positive integer string', () => {
    expect(parsePageParam('7')).toBe(7);
  });
});

describe('warnIfTruncated', () => {
  it('warns only at the per-request cap', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnIfTruncated(MAX_LISTING_IDS - 1, 'x');
    expect(warn).not.toHaveBeenCalled();
    warnIfTruncated(MAX_LISTING_IDS, 'x');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
