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

  // Mark hydration complete after first client render
  React.useEffect(() => {
    setHydrated(true);
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
