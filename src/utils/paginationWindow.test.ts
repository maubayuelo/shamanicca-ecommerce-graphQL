import { describe, expect, it } from 'vitest';
import {
  DESKTOP_MIN,
  PHONE_MAX,
  TABLET_CELL,
  buildPageItems,
  fixedCounts,
  listWidth,
  pageItemsForWidth,
  tabletCounts,
  type PageItem,
} from './paginationWindow';

const label = (items: PageItem[]) => items.map((i) => (i.type === 'dots' ? '…' : String(i.page))).join(' ');
const at = (width: number | null, totalPages: number, currentPage: number, s = 1, b = 1) =>
  pageItemsForWidth({ totalPages, currentPage, width, siblingCount: s, boundaryCount: b });

describe('buildPageItems (unchanged algorithm)', () => {
  it('shows every page when they all fit the window', () => {
    expect(label(buildPageItems({ totalPages: 6, currentPage: 3, siblingCount: 1, boundaryCount: 1 }))).toBe('1 2 3 4 5 6');
  });

  it('collapses with ellipses when the window is small', () => {
    expect(label(buildPageItems({ totalPages: 6, currentPage: 1, siblingCount: 0, boundaryCount: 1 }))).toBe('1 2 3 … 6');
    expect(label(buildPageItems({ totalPages: 6, currentPage: 6, siblingCount: 0, boundaryCount: 1 }))).toBe('1 … 4 5 6');
    expect(label(buildPageItems({ totalPages: 20, currentPage: 10, siblingCount: 1, boundaryCount: 1 }))).toBe('1 … 9 10 11 … 20');
  });

  it('returns a single page for one page or none', () => {
    expect(label(buildPageItems({ totalPages: 1, currentPage: 1, siblingCount: 1, boundaryCount: 1 }))).toBe('1');
    expect(label(buildPageItems({ totalPages: 0, currentPage: 1, siblingCount: 1, boundaryCount: 1 }))).toBe('1');
  });
});

describe('fixed counts outside the tablet range (unchanged)', () => {
  it('phone: no siblings, one boundary page', () => {
    expect(fixedCounts(375, 1, 1)).toEqual({ siblingCount: 0, boundaryCount: 1 });
    expect(fixedCounts(PHONE_MAX, 1, 1)).toEqual({ siblingCount: 0, boundaryCount: 1 });
  });

  it('desktop: at least two siblings and two boundary pages', () => {
    expect(fixedCounts(DESKTOP_MIN, 1, 1)).toEqual({ siblingCount: 2, boundaryCount: 2 });
    expect(fixedCounts(1440, 3, 4)).toEqual({ siblingCount: 3, boundaryCount: 4 });
  });

  it('phone and desktop produce exactly the previous windows for every page count', () => {
    for (const width of [320, 375, 600, 1024, 1280, 1440, 1920]) {
      for (let total = 1; total <= 30; total++) {
        for (let cur = 1; cur <= total; cur++) {
          const c = fixedCounts(width, 1, 1);
          expect(at(width, total, cur)).toEqual(buildPageItems({ totalPages: total, currentPage: cur, ...c }));
        }
      }
    }
  });

  it('uses the props before the first client render (width null)', () => {
    expect(at(null, 20, 10)).toEqual(buildPageItems({ totalPages: 20, currentPage: 10, siblingCount: 1, boundaryCount: 1 }));
  });
});

describe('tablet window (601-1023px)', () => {
  it('cell math: a full 6-page list is 777px (measured), too wide for 601-806px', () => {
    const full = buildPageItems({ totalPages: 6, currentPage: 1, siblingCount: 1, boundaryCount: 1 });
    expect(listWidth(full)).toBe(72 + 73 + 2 + 6 * 105);
    expect(listWidth(full)).toBe(777);
  });

  it('cell math: the narrowest window (current page between two ellipses) is 394px', () => {
    expect(listWidth(buildPageItems({ totalPages: 6, currentPage: 3, siblingCount: 0, boundaryCount: 0 }))).toBe(72 + 73 + 2 + 105 + 2 * 71);
  });

  it('never exceeds the container, for every width, page count and current page', () => {
    const widths = [601, 602, 620, 634, 667, 668, 700, 768, 807, 830, 856, 900, 1000, 1023];
    for (let width = 601; width < DESKTOP_MIN; width += 11) widths.push(width);
    for (const width of widths) {
      for (let total = 1; total <= 30; total++) {
        for (let cur = 1; cur <= total; cur++) {
          const items = at(width, total, cur);
          expect(listWidth(items)).toBeLessThanOrEqual(width - TABLET_CELL.gutter);
        }
      }
    }
  });

  it('always shows the current page', () => {
    for (let width = 601; width < DESKTOP_MIN; width += 61) {
      for (let total = 1; total <= 30; total++) {
        for (let cur = 1; cur <= total; cur++) {
          expect(at(width, total, cur)).toContainEqual({ type: 'page', page: cur });
        }
      }
    }
  });

  it('shrinks the window as the viewport narrows (6 pages)', () => {
    const shape = (w: number) => label(at(w, 6, 3));
    expect(shape(830)).toBe('1 2 3 4 5 6'); // 830: full list fits (777 <= 800)
    expect(shape(768)).toBe('1 2 3 … 6'); // 768: boundary + current fits
    expect(shape(601)).toBe('… 3 …'); // 601: only the current page fits
  });

  it('keeps one shape per width while paging (no jumping window)', () => {
    for (const width of [601, 620, 700, 768, 830]) {
      const shapes = new Set<string>();
      for (let cur = 1; cur <= 6; cur++) shapes.add(JSON.stringify(tabletCounts(width, 6, 1, 1)));
      expect(shapes.size).toBe(1);
    }
  });

  it('picks the props window as soon as the whole list fits (7 pages)', () => {
    expect(label(at(1023, 7, 1))).toBe('1 2 3 4 5 6 7');
    expect(tabletCounts(1023, 7, 1, 1)).toEqual({ siblingCount: 1, boundaryCount: 1 });
  });

  it('is unchanged at the tablet/desktop boundary widths outside the range', () => {
    expect(at(PHONE_MAX, 6, 3)).toEqual(buildPageItems({ totalPages: 6, currentPage: 3, ...fixedCounts(PHONE_MAX, 1, 1) }));
    expect(at(DESKTOP_MIN, 6, 3)).toEqual(buildPageItems({ totalPages: 6, currentPage: 3, ...fixedCounts(DESKTOP_MIN, 1, 1) }));
  });
});
