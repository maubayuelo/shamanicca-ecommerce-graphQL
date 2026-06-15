/**
 * navigation.ts — Static fallback navigation data
 *
 * This file defines the site's navigation structure as a hardcoded array.
 * It is used as a FALLBACK in case the API calls in Header.tsx fail to load
 * categories from WooCommerce or WordPress.
 *
 * IN PRODUCTION the Header dynamically builds its nav from two API calls:
 *  - GET /api/shop/categories   → WooCommerce product categories
 *  - GET /api/blog/categories   → WordPress blog categories
 *
 * If those API calls succeed, this file's data is NOT used (the CMS is the source of truth).
 * If they fail, the Header falls back to just Blog + About (see Header.tsx staticItems).
 * This file serves as documentation of the intended nav structure and for reference.
 *
 * STRUCTURE:
 *  Each item has: id, label, href, type, order, and optional children[]
 *  Children[] represent dropdown sub-navigation items.
 *  Currently all children href to the parent category page (no nested /shop/men/t-shirts routes yet).
 */

// Navigation data structure for the site — shaped so it can map easily to a future GraphQL schema
// Keep this file in JS/TS-friendly format. If the project is TypeScript, this file can be renamed
// to `.ts` and typed. For now we export a plain array of objects.

export const navigation = [
  {
    id: 'men',
    label: 'Men',
    href: '/shop/men',
    type: 'collection',
    order: 1,
    children: [
      // Point subcategory links to the parent category route (no nested routes yet)
      { id: 'men-tshirts', label: 'T-Shirts', href: '/shop/men' },
      { id: 'men-hoodies', label: 'Hoodies', href: '/shop/men' },
      { id: 'men-sweatshirts', label: 'Sweatshirts', href: '/shop/men' },
      { id: 'men-jackets', label: 'Jackets', href: '/shop/men' },
    ],
  },
  {
    id: 'women',
    label: 'Women',
    href: '/shop/women',
    type: 'collection',
    order: 2,
    children: [
      { id: 'women-tshirts', label: 'T-Shirts', href: '/shop/women' },
      { id: 'women-hoodies', label: 'Hoodies', href: '/shop/women' },
      { id: 'women-sweatshirts', label: 'Sweatshirts', href: '/shop/women' },
      { id: 'women-jackets', label: 'Jackets', href: '/shop/women' },
    ],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    href: '/shop/accessories',
    type: 'collection',
    order: 3,
    children: [
      { id: 'acc-caps', label: 'Caps', href: '/shop/accessories' },
      { id: 'acc-beanies', label: 'Beanies', href: '/shop/accessories' },
      { id: 'acc-socks', label: 'Socks', href: '/shop/accessories' },
      { id: 'acc-bags', label: 'Bags', href: '/shop/accessories' },
      { id: 'acc-phonecases', label: 'Phone Cases', href: '/shop/accessories' },
    ],
  },
  {
  id: 'mystical-home',
  label: 'Mystical Home',
  href: '/shop/mystical-home',
  type: 'collection',
  order: 4,
  children: [
    { id: 'altar-mugs', label: 'Mugs', href: '/shop/mystical-home' },
    { id: 'altar-waterbottles', label: 'Water Bottles', href: '/shop/mystical-home' },
    { id: 'altar-wallart', label: 'Wall Art', href: '/shop/mystical-home' },
    { id: 'altar-stickers', label: 'Stickers', href: '/shop/mystical-home' },
    { id: 'altar-tapestries', label: 'Altar Tapestries', href: '/shop/mystical-home' },
    { id: 'mystic-talismans', label: 'Talismans', href: '/shop/mystical-home' },
    { id: 'mystic-candles', label: 'Candles', href: '/shop/mystical-home' }, 
    { id: 'mystic-crystals', label: 'Crystals', href: '/shop/mystical-home' }
  ]
},
  {
    id: 'bestsellers',
    label: 'Best Sellers',
    href: '/shop/best-sellers',
    type: 'collection',
    order: 5,
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '/blog',
    type: 'collection',
    order: 6,
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    type: 'collection',
    order: 7,
  },
  // {
  //   id: 'new',
  //   label: 'New Arrivals',
  //   href: '/shop/new-arrivals',
  //   type: 'collection',
  //   order: 5,
  // },
  // {
  //   id: 'limited',
  //   label: 'Limited Edition',
  //   href: '/shop/limited-edition',
  //   type: 'collection',
  //   order: 7,
  // },
  // {
  //   id: 'gifts',
  //   label: 'Gift Ideas',
  //   href: '/shop/gift-ideas',
  //   type: 'collection',
  //   order: 8,
  // },
];

export default navigation;
