import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: { sourceUrl?: string } | null;
};

export type CartItemId = string; // composed id: `${product.id}:${variantKey}`

export type CartItem = {
  key: CartItemId;
  product: CartProduct;
  qty: number;
  options?: {
    size?: string;
  };
};

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: Omit<CartItem, 'key'>) => void;
  removeItem: (key: CartItemId) => void;
  updateQty: (key: CartItemId, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

const makeKey = (p: CartProduct, options?: CartItem['options']): CartItemId => {
  const size = options?.size ?? '';
  return `${p.id}:${size}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      addItem: (item) => {
        const key = makeKey(item.product, item.options);
        const existing = get().items.find((i) => i.key === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === key ? { ...i, qty: i.qty + item.qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, key }] });
        }
      },
      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      updateQty: (key, qty) => {
        const q = Math.max(1, qty);
        set({ items: get().items.map((i) => (i.key === key ? { ...i, qty: q } : i)) });
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.qty * (i.product.price ?? 0), 0),
    }),
    {
      name: 'shamanicca-cart',
      version: 1,
      // Persist only cart items; exclude runtime flags
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => {
        return () => {
          // Mark store hydrated after localStorage restore to avoid SSR mismatch
          set({ hasHydrated: true });
        };
      },
    }
  )
);
