/**
 * cart.tsx — Cart state management using React Context API
 *
 * This file implements the shopping cart using React's built-in Context API.
 * It is the primary cart implementation used throughout the app.
 *
 * HOW REACT CONTEXT WORKS:
 *  1. Create a Context object (the "channel" for data)
 *  2. Wrap your app in a Provider (the component that holds the state)
 *  3. Any child component can read/update the state via a custom hook
 *
 * PERSISTENCE:
 * Cart items are saved to localStorage so they survive page refreshes.
 * On mount, we read from localStorage to restore the previous cart.
 *
 * SSR SAFETY:
 * localStorage doesn't exist on the server (Next.js renders pages server-side).
 * The `readInitialItems` function checks `typeof window === 'undefined'` to
 * avoid errors when Next.js renders the page on the server.
 * The `hydrated` flag tells components to wait before showing cart counts,
 * preventing a flicker where the server renders "0 items" and then the
 * browser updates to the real count.
 *
 * ORDER COMPLETION DETECTION:
 * After a user completes a purchase on WooCommerce, it sets a cookie called
 * `shamanicca_order_complete`. On next load, this cart detects that cookie
 * and clears the cart automatically.
 */

import React from 'react';

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: { sourceUrl?: string } | null;
};

export type CartItemId = string; // `${product.id}:${size}`

export type CartItem = {
  key: CartItemId;
  product: CartProduct;
  qty: number;
  options?: { size?: string };
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: Omit<CartItem, 'key'>) => void;
  removeItem: (key: CartItemId) => void;
  updateQty: (key: CartItemId, qty: number) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'shamanicca-cart';

const makeKey = (p: CartProduct, options?: CartItem['options']): CartItemId => {
  const size = options?.size ?? '';
  return `${p.id}:${size}`;
};

function readInitialItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CartItem[];
  } catch {}
  return [];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(() => readInitialItems());
  const [hydrated, setHydrated] = React.useState(false);

  // Mark hydration complete after first client render.
  // Also detect the cross-domain cookie set by WooCommerce on successful order
  // completion and clear the cart so purchased items don't persist on the React site.
  React.useEffect(() => {
    setHydrated(true);
    if (document.cookie.split(';').some((c) => c.trim().startsWith('shamanicca_order_complete='))) {
      setItems([]);
      // Delete the flag cookie across all possible domain scopes
      const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = `shamanicca_order_complete=; ${expire}`;
      document.cookie = `shamanicca_order_complete=; ${expire}; domain=.shamanicca.com`;
    }
  }, []);

  // Persist items to localStorage when they change
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem: CartContextValue['addItem'] = React.useCallback((item) => {
    const key = makeKey(item.product, item.options);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i));
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const removeItem: CartContextValue['removeItem'] = React.useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQty: CartContextValue['updateQty'] = React.useCallback((key, qty) => {
    const q = Math.max(1, qty);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: q } : i)));
  }, []);

  const clear: CartContextValue['clear'] = React.useCallback(() => {
    setItems([]);
  }, []);

  const value = React.useMemo(
    () => ({ items, hydrated, addItem, removeItem, updateQty, clear }),
    [items, hydrated, addItem, removeItem, updateQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
