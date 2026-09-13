import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CartItem, CartProduct, CartProvider, useCart } from './cart';

const STORAGE_KEY = 'shamanicca-cart';

function makeProduct(overrides: Partial<CartProduct> = {}): CartProduct {
  return { id: '1', name: 'Tee', slug: 'tee', price: 10, ...overrides };
}

function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

beforeEach(() => {
  expect(window.localStorage.length).toBe(0);
});

afterEach(() => {
  window.localStorage.clear();
  clearCookie('shamanicca_order_complete');
});

describe('persistence', () => {
  it('writes the item to localStorage as JSON after addItem', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 2, options: { size: 'M' } });
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string) as CartItem[];
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ key: '1:M', qty: 2 });
  });

  it('rehydrates items from pre-seeded localStorage on mount', () => {
    const seeded: CartItem[] = [{ key: '1:M', product: makeProduct(), qty: 4, options: { size: 'M' } }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual(seeded);
  });

  it('initializes empty when localStorage holds invalid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual([]);
  });

  it('initializes empty when localStorage holds a non-array value', () => {
    window.localStorage.setItem(STORAGE_KEY, '{}');

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual([]);
  });
});

describe('hydration flag', () => {
  it('is true after mount effects run', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.hydrated).toBe(true);
  });
});

describe('order-complete cookie', () => {
  it('clears a seeded cart on mount when the cookie is present', () => {
    const seeded: CartItem[] = [{ key: '1:', product: makeProduct(), qty: 1 }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    document.cookie = 'shamanicca_order_complete=1';

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual([]);
  });

  it('does NOT clear a seeded cart on mount without the cookie', () => {
    const seeded: CartItem[] = [{ key: '1:', product: makeProduct(), qty: 1 }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual(seeded);
  });
});
