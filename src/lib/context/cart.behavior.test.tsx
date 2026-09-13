import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { CartProvider, CartProduct, useCart } from './cart';

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

describe('addItem — adding & keying', () => {
  it('appends a new line item with the given qty', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 2 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
  });

  it('merges the same product+size into one line item with summed qty', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 2, options: { size: 'M' } });
      result.current.addItem({ product: makeProduct(), qty: 3, options: { size: 'M' } });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(5);
  });

  it('creates two line items when the same product id has different sizes', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 1, options: { size: 'M' } });
      result.current.addItem({ product: makeProduct(), qty: 1, options: { size: 'L' } });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((i) => i.key).sort()).toEqual(['1:L', '1:M']);
  });

  it('uses key `${id}:` with an empty size segment when no options are given', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 1 });
    });

    expect(result.current.items[0].key).toBe('1:');
  });
});

describe('updateQty', () => {
  it('raises and lowers qty for only the matching key', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct({ id: '1' }), qty: 1, options: { size: 'M' } });
      result.current.addItem({ product: makeProduct({ id: '2' }), qty: 1 });
    });

    act(() => {
      result.current.updateQty('1:M', 5);
    });
    expect(result.current.items.find((i) => i.key === '1:M')?.qty).toBe(5);
    expect(result.current.items.find((i) => i.key === '2:')?.qty).toBe(1);

    act(() => {
      result.current.updateQty('1:M', 2);
    });
    expect(result.current.items.find((i) => i.key === '1:M')?.qty).toBe(2);
  });

  it('floors qty to 1 for zero and negative values', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 3, options: { size: 'M' } });
    });

    act(() => {
      result.current.updateQty('1:M', 0);
    });
    expect(result.current.items[0].qty).toBe(1);

    act(() => {
      result.current.updateQty('1:M', -5);
    });
    expect(result.current.items[0].qty).toBe(1);
  });

  it('is a no-op for a non-existent key', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 1, options: { size: 'M' } });
    });

    expect(() => {
      act(() => {
        result.current.updateQty('does-not-exist', 9);
      });
    }).not.toThrow();

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(1);
  });
});

describe('removeItem / clear', () => {
  it('removeItem drops only the matching key, leaving others', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct({ id: '1' }), qty: 1, options: { size: 'M' } });
      result.current.addItem({ product: makeProduct({ id: '2' }), qty: 1 });
    });

    act(() => {
      result.current.removeItem('1:M');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].key).toBe('2:');
  });

  it('clear empties a multi-item cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct({ id: '1' }), qty: 1 });
      result.current.addItem({ product: makeProduct({ id: '2' }), qty: 1 });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
  });
});

describe('addItem qty guard', () => {
  it('stores qty 0 as-is because addItem does not floor qty like updateQty does', () => {
    // Documents current behavior: addItem does not floor qty the way updateQty does.
    // Flag for review — possible bug.
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.addItem({ product: makeProduct(), qty: 0 });
    });

    expect(result.current.items[0].qty).toBe(0);
  });
});

describe('useCart contract', () => {
  it('throws "useCart must be used within CartProvider" when used with no provider', () => {
    function Probe() {
      useCart();
      return null;
    }

    // Suppress the expected React error boundary console.error noise for this render.
    const consoleError = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Probe />)).toThrow('useCart must be used within CartProvider');
    } finally {
      console.error = consoleError;
    }
  });
});
