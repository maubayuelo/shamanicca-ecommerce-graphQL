
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useRef, useEffect, Fragment } from 'react';
import { useBodyClass } from '../../utils/dom';
import navigation from '../../utils/navigation';
import { decodeEntities } from '../../utils/html';
import { useCart } from '../../lib/context/cart';

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
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastHeaderHeightRef = useRef<number>(0);
  const nav = navigation;
  const [blogChildren, setBlogChildren] = useState<Array<{ id: string; label: string; href: string }>>([]);
  const router = useRouter();
  const { items, hydrated: cartHydrated } = useCart();
  const cartCount = items.reduce((acc, i) => acc + i.qty, 0);

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

  // Ensure only one <details> in the mobile nav is expanded at a time.
  // When a details element is opened, close all sibling details elements.
  const handleDetailsToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const el = e.currentTarget as HTMLDetailsElement;
    if (!el.open) return; // only act when it's being opened
    const container = mobileNavRef.current;
    if (!container) return;
    const detailsList = Array.from(container.querySelectorAll('details')) as HTMLDetailsElement[];
    detailsList.forEach((d) => {
      if (d !== el) d.open = false;
    });
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
      const h = headerRef.current?.offsetHeight ?? 0;
      // Only update CSS var when value actually changes to avoid observer loops
      if (h !== lastHeaderHeightRef.current) {
        lastHeaderHeightRef.current = h;
        document.documentElement.style.setProperty('--header-height', `${h}px`);
      }
    };
    // initial and on resize
    updateHeaderHeight();
    const onResize = () => updateHeaderHeight();
    window.addEventListener('resize', onResize);
    let ro: ResizeObserver | undefined;
    if ('ResizeObserver' in window && headerRef.current) {
      ro = new ResizeObserver(() => updateHeaderHeight());
      ro.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
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
        const topLevel = cats.filter((c: any) => c.parent === 0);
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

  const computedNav = nav.map((item) =>
    item.id === 'blog' ? { ...item, children: blogChildren } : item,
  );

  return (
    <Fragment>
    <header ref={headerRef} className="header header__sticky">
      <div className="header__top_bar">
        Get 15% off orders over $50! Use code <span className="type-bold">SEASONAL15</span>.
      </div>

      <div className="main"> <div className="header__main">
        

          
          <Link href="/" className="header__logo">
            <Image src="/images/shamanicca-logo.svg" alt="Shamanicca" width={160} height={40} className="header__logo" priority />
          </Link>
          <div className="header__container">
            <nav className="header__nav" aria-label="Main navigation">
              {computedNav.map((item) => (
                <div key={item.id} className="header__nav_item_wrapper">
                  <Link href={item.href} className={`header__nav_item ${item.children ? 'has-submenu' : ''} type-bold`}>
                    {item.label}
                  </Link>
                  
                  {item.children && item.children.length > 0 && (
                    <div className="header__dropdown pt-10 pb-10" role="menu" aria-label={`${item.label} subcategories`}>
                      <ul className="">
                        {item.children.map((child) => (
                          <li key={child.id} className="header__dropdown_item">
                            <Link
                              href={
                                item.id === 'blog' && (child as any).href
                                  ? (child as any).href
                                  : {
                                      pathname: '/shop/[category]',
                                      query: { category: item.id, sub: child.id },
                                    }
                              }
                              className="type-md type-bold"
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
          <div className="header__actions">
            <button aria-label="search" className="header__action_btn" onClick={toggleSearch}>
              <Image src="/images/icon-magnifying-glass.svg" alt="Search" width={24} height={24} className="header__action_icon" />
            </button>
            {/* <button aria-label="WishList" className="header__action_btn">
              <Image src="/images/icon-heart.svg" alt="WishList" width={24} height={24} className="header__action_icon" />
            </button>
            <button aria-label="account" className="header__action_btn">
              <Image src="/images/icon-avatar.svg" alt="Account" width={24} height={24} className="header__action_icon" />
            </button> */}
            <Link href="/cart" aria-label="cart" className="header__action_btn header__action_cart">
              <Image src="/images/icon-shopping-bag.svg" alt="Cart" width={24} height={24} className="header__action_icon" />
              {cartHydrated && cartCount > 0 && (
                <span className="header__cart_badge type-bold" aria-label={`Cart items: ${cartCount}`}>{cartCount}</span>
              )}
            </Link>
            <button
              aria-label="Toggle mobile menu"
              className="header__mobile_toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Image
                src={mobileOpen ? '/images/icon-close.svg' : '/images/icon-ham-menu.svg'}
                alt={mobileOpen ? 'Close menu' : 'Open menu'}
                width={28}
                height={28}
                className="header__mobile_icon"
              />
            </button>
          </div>


        </div>
      </div>

      <hr />

      <div className={`header__mobile_menu ${mobileOpen ? 'is-open' : ''}`}>
        <nav ref={mobileNavRef} className="header__mobile_nav pb-sm-responsive" aria-label="Mobile navigation">
              {computedNav.map((item) => (
            <details key={item.id} className="mobile__details" onToggle={handleDetailsToggle}>
              <summary className="mobile__summary">
                <Link href={item.href} className={`mobile__link ${item.children ? 'has-submenu' : ''} type-bold`}>
                  {item.label}
                </Link>
              </summary>

              {item.children && (
                <ul className="mobile__subnav">
                  {item.children.map((child) => (
                    <li key={child.id} className="mobile__subnav_item">
                      <Link
                        href={
                          item.id === 'blog' && (child as any).href
                            ? (child as any).href
                            : {
                                pathname: '/shop/[category]',
                                query: { category: item.id, sub: child.id },
                              }
                        }
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </nav>
      </div>
    </header>

    {/* Search Overlay (moved outside header to layer beneath it) */}
    <div
      className={`header__search ${searchOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="header-search-title"
      onClick={closeSearchOnBackdrop}
    >
      <div className="header__search_inner" role="document">
        <h2 id="header-search-title" className="visually-hidden">Site search</h2>
        <form className="header__search_form form--condensed" role="search" aria-label="Site search">
          <div className="header__search_field">
            <label htmlFor="global-search" className="visually-hidden">Search</label>
            <input
              id="global-search"
              ref={searchInputRef}
              type="text"
              name="q"
              placeholder="Search products or posts"
              autoComplete="off"
            />
            <button type="submit" className="header__search_submit type-bold type-sm type-uppercase">Search</button>
          </div>

          <fieldset className="header__search_scope">
            <legend className="visually-hidden">Search scope</legend>
            <label className="header__search_radio">
              <input type="radio" name="scope" value="shop" defaultChecked />
              <span>Shop</span>
            </label>
            <label className="header__search_radio">
              <input type="radio" name="scope" value="blog" />
              <span>Blog</span>
            </label>
          </fieldset>
        </form>

        <div className="header__search_header">
          <button aria-label="Close search" className="header__search_close" onClick={() => setSearchOpen(false)}>
            <Image src="/images/icon-close.svg" alt="Close" width={20} height={20} />
          </button>
        </div>
      </div>
    </div>
    </Fragment>
  );
}
