import { describe, expect, it } from 'vitest';
import {
  DESKTOP_MIN,
  PHONE_MAX,
  TABLET_CELL,
  buildPageItems,
  fixedCounts,
  listWidth,
  pageItemsForWidth,
  worstListWidth,
  tabletCounts,
  type PageItem,
} from './paginationWindow';

const label = (items: PageItem[]) => items.map((i) => (i.type === 'dots' ? '…' : String(i.page))).join(' ');
const at = (width: number | null, totalPages: number, currentPage: number, container: number | null = null, s = 1, b = 1) =>
  pageItemsForWidth({ totalPages, currentPage, width, siblingCount: s, boundaryCount: b, container });

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

describe('desktop window (>= 1024px)', () => {
  // Containers seen in the app: shop (width - 60), blog below 1280 (width - 60),
  // blog next to the sidebar (width - 570).
  const containers: Array<[number, number]> = [
    [1024, 964], [1280, 710], [1280, 1220], [1330, 760], [1330, 1270], [1366, 796], [1366, 1306], [1440, 870], [1440, 1380], [1920, 1860],
  ];

  it('keeps the usual window whenever it fits the container (identical to before)', () => {
    let compared = 0;
    for (const [width, container] of containers) {
      const usual = fixedCounts(width, 1, 1);
      for (let total = 1; total <= 12; total++) {
        if (worstListWidth(total, usual.siblingCount, usual.boundaryCount) > container) continue;
        for (let cur = 1; cur <= total; cur++) {
          expect(at(width, total, cur, container)).toEqual(buildPageItems({ totalPages: total, currentPage: cur, ...usual }));
          compared++;
        }
      }
    }
    expect(compared).toBeGreaterThan(300);
  });

  it('keeps the usual window when the container is not known yet', () => {
    for (let total = 1; total <= 12; total++) {
      expect(at(1280, total, 1, null)).toEqual(buildPageItems({ totalPages: total, currentPage: 1, ...fixedCounts(1280, 1, 1) }));
    }
  });

  it('does not change the shop and blog lists that fit today (6 and 7 pages)', () => {
    expect(label(at(1024, 6, 3, 964))).toBe('1 2 3 4 5 6');
    expect(label(at(1366, 6, 3, 796))).toBe('1 2 3 4 5 6');
    expect(label(at(1440, 6, 3, 870))).toBe('1 2 3 4 5 6');
    expect(label(at(1024, 7, 3, 964))).toBe('1 2 3 4 5 6 7');
    expect(label(at(1440, 7, 3, 1380))).toBe('1 2 3 4 5 6 7');
  });

  it('never exceeds the container for 7 to 10 pages and always keeps the current page', () => {
    for (const [width, container] of containers) {
      for (let total = 7; total <= 10; total++) {
        for (let cur = 1; cur <= total; cur++) {
          const items = at(width, total, cur, container);
          expect(listWidth(items)).toBeLessThanOrEqual(container);
          expect(items).toContainEqual({ type: 'page', page: cur });
        }
      }
    }
  });

  it('falls back through the candidates when the usual window does not fit', () => {
    // 1280 beside the sidebar: a 710px column cannot hold 6 pages (777px)
    expect(label(at(1280, 6, 3, 710))).toBe('1 2 3 … 6');
    // 7 pages in a 964px container: the usual 2+2 window is too wide, 1+1 fits
    expect(listWidth(at(1024, 10, 5, 964))).toBeLessThanOrEqual(964);
  });

  it('keeps one window shape while paging at a given container', () => {
    for (const [width, container] of containers) {
      const usual = fixedCounts(width, 1, 1);
      const candidates = [usual, { siblingCount: 1, boundaryCount: 1 }, { siblingCount: 0, boundaryCount: 1 }, { siblingCount: 1, boundaryCount: 0 }, { siblingCount: 0, boundaryCount: 0 }];
      for (const total of [7, 8, 9, 10]) {
        const oneShape = candidates.some((c) =>
          Array.from({ length: total }, (_, k) => k + 1).every(
            (cur) => JSON.stringify(at(width, total, cur, container)) === JSON.stringify(buildPageItems({ totalPages: total, currentPage: cur, ...c })),
          ),
        );
        expect(oneShape).toBe(true);
      }
    }
  });

  it('phone is unchanged whatever the container', () => {
    expect(at(375, 6, 3, 300)).toEqual(buildPageItems({ totalPages: 6, currentPage: 3, ...fixedCounts(375, 1, 1) }));
  });
});
