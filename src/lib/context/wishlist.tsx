import React from 'react';

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  regularPrice?: number;
  image?: string | null;
};

type WishlistContextValue = {
  items: WishlistItem[];
  hydrated: boolean;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  toggle: (item: WishlistItem) => void;
};

const WishlistContext = React.createContext<WishlistContextValue | undefined>(undefined);

const STORAGE_KEY = 'shamanicca-wishlist';

function readInitialItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as WishlistItem[];
  } catch {}
  return [];
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<WishlistItem[]>(() => readInitialItems());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => { setHydrated(true); }, []);

  React.useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const addItem = React.useCallback((item: WishlistItem) => {
    setItems((prev) => prev.some((i) => i.id === item.id) ? prev : [...prev, item]);
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isWishlisted = React.useCallback((id: string) => {
    return items.some((i) => i.id === id);
  }, [items]);

  const toggle = React.useCallback((item: WishlistItem) => {
    setItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  }, []);

  const value = React.useMemo(
    () => ({ items, hydrated, addItem, removeItem, isWishlisted, toggle }),
    [items, hydrated, addItem, removeItem, isWishlisted, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
