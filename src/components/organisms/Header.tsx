/**
 * Header.tsx — Site-wide navigation header (Organism)
 *
 * This is one of the most complex components in the app. It handles:
 *
 * NAVIGATION:
 *  - Fetches shop categories from /api/shop/categories (WooCommerce via GraphQL)
 *  - Fetches blog categories from /api/blog/categories (WordPress via GraphQL)
 *  - Builds the nav dynamically from CMS data (so adding a WooCommerce category
 *    automatically adds it to the nav without code changes)
 *  - Falls back to static Blog/About links if the API fails
 *
 * DESKTOP MENU:
 *  - Top-level nav items with hover dropdowns for sub-categories
 *  - Accessible: dropdowns use role="menu" and aria-label
 *
 * MOBILE MENU:
 *  - Hamburger button toggles a full-screen overlay menu
 *  - Sub-menus expand/collapse with +/- toggle buttons
 *  - Controlled by `mobileExpandedId` state (only one submenu open at a time)
 *
 * SEARCH:
 *  - Search overlay with scope selector (Shop or Blog)
 *  - Submits to /search?q=...&scope=...
 *  - Closes on Escape key or clicking the backdrop
 *
 * CART & WISHLIST BADGES:
 *  - Real-time item counts from CartContext and WishlistContext
 *  - Only shown after `hydrated: true` to avoid SSR mismatch flash
 *
 * PERFORMANCE:
 *  - Header height is tracked via ResizeObserver and stored as a CSS custom property
 *    (--header-height) so other elements (like the search panel) can position
 *    themselves relative to the bottom of the header dynamically
 *  - Navigation data is fetched client-side once on mount
 */

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect, Fragment } from 'react';
import { useBodyClass } from '../../utils/dom';
import { decodeEntities } from '../../utils/html';
import { useCart } from '../../lib/context/cart';
import { useWishlist } from '../../lib/context/wishlist';
import React from 'react';

/**
 * Header component that renders the site logo, navigation, action buttons and a responsive mobile menu.
 *
 * Dropdown Menu:
 * - When a navigation item includes children, a dropdown container is rendered containing those child links.
 * - The dropdown is marked with role="menu" and an aria-label of "{item.label} subcategories" for accessibility.
 * - Child items are output as a list of link elements inside the dropdown; on mobile the same child links are exposed via a <details>/<summary> collapsible pattern.
 *
 * @returns JSX.Element
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Track which mobile nav item has its submenu open (by item id); null = all closed
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastHeaderHeightRef = useRef<number>(0);
  // Static non-shop items; avoid importing navigation.ts
  const staticItems = [
    { id: 'blog', label: 'Blog', href: '/blog' },
    { id: 'about', label: 'About', href: '/about' },
  ];
  const [blogChildren, setBlogChildren] = useState<Array<{ id: string; label: string; href: string }>>([]);
  const [shopCategories, setShopCategories] = useState<Array<{ id: string; label: string; href: string; children?: Array<{ id: string; label: string; href: string }> }>>([]);
  const router = useRouter();
  const { items, hydrated: cartHydrated } = useCart();
  const cartCount = items.reduce((acc, i) => acc + i.qty, 0);
  const { items: wishlistItems, hydrated: wishlistHydrated } = useWishlist();
  const wishlistCount = wishlistItems.length;

  // Unified: toggle a marker class on body when overlays are open (no inline styles)
  useBodyClass('no-scroll', mobileOpen || searchOpen);

  // Focus the input when opening search
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      // slight delay to ensure rendering
      const t = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Toggle a mobile submenu: opens the clicked one, closes any other open one
  const toggleMobileSubmenu = (id: string) => {
    setMobileExpandedId((prev) => (prev === id ? null : id));
  };

  // Close search on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Measure header height to position search panel just under it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateHeaderHeight = () => {
      // Use getBoundingClientRect().bottom so the search panel always opens
      // directly below the header's visual bottom, even when the announcement
      // banner (rendered above the header in _app.tsx) is visible.
      const bottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      if (bottom !== lastHeaderHeightRef.current) {
        lastHeaderHeightRef.current = bottom;
        document.documentElement.style.setProperty('--header-height', `${bottom}px`);
      }
    };
    // initial, on resize, and on scroll (sticky state changes the bottom position)
    updateHeaderHeight();
    const onResize = () => updateHeaderHeight();
    const onScroll = () => updateHeaderHeight();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    let ro: ResizeObserver | undefined;
    if ('ResizeObserver' in window && headerRef.current) {
      ro = new ResizeObserver(() => updateHeaderHeight());
      ro.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, []);

  const toggleSearch = () => {
    // Ensure mobile menu is closed when opening search
    if (!searchOpen && mobileOpen) setMobileOpen(false);
    setSearchOpen((v) => !v);
  };

  const closeSearchOnBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) setSearchOpen(false);
  };

  // Close mobile menu and search when navigating to another route
  useEffect(() => {
    const handleRoute = () => {
      // Only update when needed to avoid redundant state changes
      setMobileOpen((prev) => (prev ? false : prev));
      setSearchOpen((prev) => (prev ? false : prev));
      setMobileExpandedId(null);
    };
    // Only react after navigation completes to minimize duplicate updates
    router.events.on('routeChangeComplete', handleRoute);
    return () => {
      router.events.off('routeChangeComplete', handleRoute);
    };
    // Subscribe once; Next.js router.events is stable, avoid ref changes causing re-subscribe loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch blog categories via local API and attach them under the Blog nav item
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/blog/categories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cats = await res.json();
        // Filter out 'uncategorized' and get top-level categories
        const topLevel = cats.filter((c: any) => c.parent === 0 && c.slug !== 'uncategorized' && c.slug !== 'top-reads');
        const children = topLevel.map((c) => ({
          id: `blog-${c.slug}`,
          label: decodeEntities(c.name),
          href: `/blog/category/${c.slug}`,
        }));
        if (mounted) setBlogChildren(children);
      } catch {
        // silently ignore fetch errors; nav will remain without blog children
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch WooCommerce product categories and build shop navigation
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/shop/categories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cats = await res.json();
        
        // Get top-level categories (no parent) and filter out 'uncategorized'
        const topLevel = cats.filter((c: any) => c.parent === 0 && c.slug !== 'uncategorized' && c.slug !== 'best-sellers' && c.slug !== 'featured-products');
        // Sort top-level by menuOrder
        topLevel.sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0));
        
        // Build navigation structure with children
        const navItems = topLevel.map((c: any) => {
          const children = cats
            .filter((child: any) => child.parent === c.id)
            .map((child: any) => ({
              id: child.slug,
              label: decodeEntities(child.name),
              href: `/shop/${child.slug}`,
              menuOrder: child.menuOrder || 0,
            }));
          
          // Sort children by menuOrder
          children.sort((a: any, b: any) => a.menuOrder - b.menuOrder);
          
          return {
            id: c.slug,
            label: decodeEntities(c.name),
            href: `/shop/${c.slug}`,
            children: children.length > 0 ? children : undefined,
          };
        });
        
        if (mounted) setShopCategories(navItems);
      } catch {
        // silently ignore fetch errors; will use hardcoded nav as fallback
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Build navigation: Women, Men, Accessories, Sacred Objects, Best Sellers, Blog, About
  const computedNav = React.useMemo(() => {
    // If we have shop categories from CMS, compose with static Blog/About
    if (shopCategories.length > 0) {
      const blog = staticItems.find(i => i.id === 'blog');
      const about = staticItems.find(i => i.id === 'about');
      const finalNav: Array<any> = [...shopCategories];
      if (blog) finalNav.push({ ...blog, children: blogChildren });
      if (about) finalNav.push(about as any);
      return finalNav;
    }
    // Fallback minimal nav
    return staticItems.map((item) =>
      item.id === 'blog' ? { ...item, children: blogChildren } : item,
    );
  }, [shopCategories, blogChildren]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem('q') as HTMLInputElement)?.value.trim();
    const scope = (form.querySelector<HTMLInputElement>('input[name="scope"]:checked'))?.value ?? 'shop';
    if (!q) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}&scope=${scope}`);
  };

  return (
    <Fragment>
    <header ref={headerRef} className="header sticky top-0 z-[1000] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      {/* <div className="header__top_bar">
        Get 15% off orders over $50! Use code <span className="type-bold">SEASONAL15</span>.
      </div> */}


      <div className="main"> <div className="flex items-center justify-between p-2.5 xl:p-0">
        

          
          <Link href="/" className="flex">
            <Image src="/images/shamanicca-logo.svg" alt="Shamanicca" width={160} height={40} className="h-[1.8rem] w-auto cursor-pointer" priority />
          </Link>
          <div className="h-fit">
            {/* The ! on xl:flex (and on the submenu's block) is needed only to beat the unlayered .hidden !important in helpers.scss; drop it when that helper is removed. */}
            <nav className="hidden h-full xl:flex! font-[family-name:var(--font-main)]" aria-label="Main navigation">
              {computedNav.map((item) => (
                <div key={item.id} className="header__nav_item_wrapper group relative flex items-center hover:bg-gray-200 focus:bg-gray-200">
                  <Link href={item.href} className={`header__nav_item ${item.children ? 'has-submenu' : ''} type-bold relative flex flex-row flex-nowrap items-center content-center justify-between gap-1.5 p-legacy-15 h-[calc(100%-30px)] text-[0.9375rem] leading-none text-black no-underline cursor-pointer hover:text-primary-500 focus:text-primary-500`}>
                    {item.label}
                  </Link>
                  
                  {item.children && item.children.length > 0 && (
                    <div className="pt-2.5 pb-2.5 absolute left-0 top-full z-40 mt-0 min-w-45 hidden [.group:hover_&]:block! group-focus-within:block! rounded-b-md bg-gray-200" role="menu" aria-label={`${item.label} subcategories`}>
                      <ul className="list-none m-0 p-0 rounded-b-md">
                        {item.children.map((child) => (
                          <li key={child.id} className="p-0 m-0">
                            <Link
                              href={
                                item.id === 'blog' && (child as any).href
                                  ? (child as any).href
                                  : `/shop/${child.id}`
                              }
                              className="type-md type-bold block m-0 py-1.25 px-legacy-15 w-[calc(100%-30px)] text-[#111] no-underline hover:text-primary-500"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-legacy-15">
            <button aria-label="search" className="bg-transparent border-0 cursor-pointer p-0 m-0 hover:opacity-60" onClick={toggleSearch}>
              <Image src="/images/icon-magnifying-glass.svg" alt="Search" width={24} height={24} className="size-6" />
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className="relative inline-flex items-center no-underline bg-transparent border-0 cursor-pointer p-0 m-0 hover:opacity-60">
              <Image src="/images/icon-heart.svg" alt="Wishlist" width={24} height={24} className="size-6" />
              {wishlistHydrated && wishlistCount > 0 && (
                <span className="type-bold absolute -top-2 -right-2 min-w-4.5 h-4.5 p-0 rounded-[9px] [background:var(--color-primary-500)] text-white text-[11px] leading-4.5 text-center" aria-label={`Wishlist items: ${wishlistCount}`}>{wishlistCount}</span>
              )}
            </Link>
            <Link href="/cart" aria-label="cart" className="relative inline-flex items-center no-underline bg-transparent border-0 cursor-pointer p-0 m-0 hover:opacity-60">
              <Image src="/images/icon-shopping-bag.svg" alt="Cart" width={24} height={24} className="size-6" />
              {cartHydrated && cartCount > 0 && (
                <span className="type-bold absolute -top-2 -right-2 min-w-4.5 h-4.5 p-0 rounded-[9px] [background:var(--color-primary-500)] text-white text-[11px] leading-4.5 text-center" aria-label={`Cart items: ${cartCount}`}>{cartCount}</span>
              )}
            </Link>
            <button
              aria-label="Toggle mobile menu"
              className="inline-block xl:hidden bg-transparent border-0"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Image
                src={mobileOpen ? '/images/icon-close.svg' : '/images/icon-ham-menu.svg'}
                alt={mobileOpen ? 'Close menu' : 'Open menu'}
                width={28}
                height={28}
                className="size-6"
              />
            </button>
          </div>


        </div>
      </div>

      <hr className="m-0 border-0 border-t border-solid border-t-[#b2b2b2]" />

      <div className={`xl:hidden ${mobileOpen ? 'block fixed top-[var(--header-height,_64px)] left-0 right-0 h-[calc(100dvh_-_var(--header-height,_64px))] overflow-y-auto [-webkit-overflow-scrolling:touch] bg-white z-[999] shadow-[0_4px_12px_rgba(0,0,0,0.1)]' : 'hidden'}`}>
        <nav ref={mobileNavRef} className="pb-sm-responsive bg-white" aria-label="Mobile navigation">
          {computedNav.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = mobileExpandedId === item.id;
            return (
              <div key={item.id} className="border-b border-b-gray-200">
                <div className="flex items-center justify-between p-legacy-15">
                  <Link
                    href={item.href}
                    className="type-bold text-black no-underline flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {hasChildren && (
                    <button
                      className="bg-transparent border-0 cursor-pointer text-xl leading-none py-0 px-1.25 text-black shrink-0 [&:hover]:text-primary-500"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} menu`}
                      onClick={() => toggleMobileSubmenu(item.id)}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <ul className="list-none pt-0 pr-legacy-15 pb-legacy-15 pl-7.5 m-0 bg-gray-50">
                    {item.children!.map((child: any) => (
                      <li key={child.id} className="py-1.5 px-0">
                        <Link
                          href={item.id === 'blog' && child.href ? child.href : `/shop/${child.id}`}
                          className="text-[#333] no-underline [&:hover]:text-primary-500"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>

    {/* Search Overlay (moved outside header to layer beneath it) */}
    <div
      className={`header__search fixed left-0 top-[var(--header-height,_64px)] bg-black p-legacy-15 w-[calc(100%-30px)] z-[900] overflow-hidden [transition:max-height_0.25s_ease,opacity_0.2s_ease,transform_0.25s_ease] ${searchOpen ? 'max-h-65 opacity-100 [transform:translateY(0)] pointer-events-auto' : 'max-h-0 opacity-0 [transform:translateY(-9px)] pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="header-search-title"
      onClick={closeSearchOnBackdrop}
    >
      <div className="mx-auto text-white flex flex-row justify-between w-full max-w-150 items-start md:items-center" role="document">
        <h2 id="header-search-title" className="visually-hidden">Site search</h2>
        <form className="header__search_form form--condensed w-full flex flex-col gap-legacy-15 sm:flex-row" role="search" aria-label="Site search" onSubmit={handleSearchSubmit}>
          <div className="header__search_field grid grid-cols-[1fr_auto] items-center w-full">
            <label htmlFor="global-search" className="visually-hidden">Search</label>
            <input
              id="global-search"
              ref={searchInputRef}
              type="text"
              name="q"
              placeholder="Search products or posts"
              autoComplete="off"
              className="[font-family:Poppins,sans-serif] text-[14px] leading-6 p-2.5 flex-1 bg-white border border-gray-300 border-r-0 rounded-[10px_0_0_10px] text-black [transition:all_0.2s_ease] [box-shadow:0px_3px_6px_-3px_rgba(0,0,0,0.05)] [&::placeholder]:text-gray-500 [&:focus]:[outline:none] [&:focus]:border-[#675dff] [&:focus]:[box-shadow:0px_3px_6px_-3px_rgba(112,90,248,0.15)] [&:hover:not(:focus)]:border-gray-400 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed disabled:[&::placeholder]:text-gray-500"
            />
            <button type="submit" className="header__search_submit type-bold type-sm type-uppercase [border:2px_solid_transparent] cursor-pointer whitespace-nowrap [transition:opacity_0.2s_ease,transform_0.05s_ease-in-out,background-color_0.2s_ease] bg-[#675dff] text-white p-[10px_15px] rounded-[0_10px_10px_0] [&:hover]:bg-black [&:active]:bg-black [&:hover]:border-white [&:active]:border-white [&:hover]:[text-decoration:none] [&:active]:[text-decoration:none]">Search</button>
          </div>

          <fieldset className="header__search_scope flex gap-legacy-15 border-0 [margin:0] [padding:0]">
            <legend className="visually-hidden">Search scope</legend>
            <label className="header__search_radio inline-flex items-center gap-1.25 text-white">
              <input type="radio" name="scope" value="shop" defaultChecked className="[accent-color:#675dff] [margin:0]" />
              <span>Shop</span>
            </label>
            <label className="header__search_radio inline-flex items-center gap-1.25 text-white">
              <input type="radio" name="scope" value="blog" className="[accent-color:#675dff] [margin:0]" />
              <span>Blog</span>
            </label>
          </fieldset>
        </form>

        <div className="block w-fit float-right">
          <button aria-label="Close search" className="bg-transparent border-0 cursor-pointer p-0 ml-legacy-15 size-legacy-15" onClick={() => setSearchOpen(false)}>
            <Image src="/images/icon-close.svg" alt="Close" width={20} height={20} className="size-legacy-15 invert" />
          </button>
        </div>
      </div>
    </div>
    </Fragment>
  );
}
