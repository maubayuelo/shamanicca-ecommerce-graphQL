/**
 * Suggest subcategories for a given product based on its name/slug using simple keyword matching.
 *
 * Why: Your products currently list only top-level categories (e.g., "Men", "Women", "Accessories")
 * while your navigation defines useful subcategories (e.g., T-Shirts, Hoodies, Mugs...). This helper
 * infers likely subcategories so you can surface them in the UI (chips/links) without changing your data model.
 */

import navigation from './navigation';

// Minimal product shape we need from your data
export type ProductLike = {
  name: string;
  slug?: string;
  categories?: string[];
};

type Subcat = {
  id: string;
  label: string;
  href: string;
  parentId: string;
  parentLabel: string;
};

type ScoredSubcat = Subcat & { score: number };

// Normalize to aid matching
const norm = (s: string) => s.toLowerCase();

// Keyword lists to identify subcategories — tweak freely as your catalog evolves
// Keyed by navigation child id from navigation.ts
export const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  // Men/Women apparel
  'men-tshirts': ['tee', 't-shirt', 'tshirt', 'shirt', 'pocket tee'],
  'men-hoodies': ['hoodie', 'hooded'],
  'men-sweatshirts': ['sweatshirt', 'crewneck', 'sweater'],
  'men-jackets': ['jacket', 'cloak', 'coat', 'cardigan', 'parka'],

  'women-tshirts': ['tee', 't-shirt', 'tshirt', 'shirt', 'pocket tee'],
  'women-hoodies': ['hoodie', 'hooded'],
  'women-sweatshirts': ['sweatshirt', 'crewneck', 'sweater'],
  'women-jackets': ['jacket', 'cloak', 'coat', 'cardigan', 'parka'],

  // Accessories
  'acc-caps': ['cap', 'trucker'],
  'acc-beanies': ['beanie', 'knit cap', 'toque', 'tuque'],
  'acc-socks': ['sock', 'socks'],
  'acc-bags': ['bag', 'pack', 'backpack', 'tote'],
  'acc-phonecases': ['phone case', 'phone-case', 'case'],

  // Mystical Home
  'altar-mugs': ['mug', 'cup', 'chalice', 'goblet'],
  'altar-waterbottles': ['water bottle', 'bottle', 'flask'],
  'altar-wallart': ['wall art', 'poster', 'print', 'canvas'],
  'altar-stickers': ['sticker', 'decal'],
  'altar-tapestries': ['tapestry'],
  'mystic-talismans': ['talisman', 'pendant', 'necklace', 'amulet', 'charm'],
  'mystic-candles': ['candle'],
  'mystic-crystals': ['crystal', 'quartz', 'gem', 'stone'],
};

// Build a flat list of all subcategories from navigation, with parent context
const allSubcategories: Subcat[] = (() => {
  const out: Subcat[] = [];
  for (const parent of navigation) {
    if (!Array.isArray(parent.children)) continue;
    for (const child of parent.children) {
      out.push({
        id: child.id,
        label: child.label,
        href: child.href,
        parentId: parent.id,
        parentLabel: parent.label,
      });
    }
  }
  return out;
})();

// Note: If you later need to boost by top-level label -> navigation lookup, build a map here.

/**
 * Given a product, return likely subcategories (up to `max`) with parent context and score.
 * - Matches keywords in name and slug
 * - Boosts subcategories that belong to a top-level category already on the product
 */
export function suggestSubcategories(
  product: ProductLike,
  max: number = 2
): ScoredSubcat[] {
  const hay = norm(`${product.name} ${product.slug ?? ''}`);
  const productTopLabels = new Set(
    (product.categories ?? []).map((c) => norm(c))
  );

  const scored: ScoredSubcat[] = [];

  for (const sub of allSubcategories) {
    const keywords = SUBCATEGORY_KEYWORDS[sub.id] || [];
    let score = 0;

    for (const kw of keywords) {
      if (hay.includes(norm(kw))) score += 1;
    }

    // Small boost if this subcategory's parent matches a product top-level category
    if (productTopLabels.has(norm(sub.parentLabel))) score += 0.5;

    if (score > 0) scored.push({ ...sub, score });
  }

  // Sort by score desc then stable by label
  scored.sort((a, b) => (b.score - a.score) || a.label.localeCompare(b.label));

  return scored.slice(0, Math.max(0, max));
}

/**
 * Convenience to get just label/href for UI badges or links.
 */
export function getSubcategoryBadges(
  product: ProductLike,
  max: number = 2
) {
  return suggestSubcategories(product, max).map((s) => ({
    id: s.id,
    label: s.label,
    href: s.href,
    parentLabel: s.parentLabel,
  }));
}

export default getSubcategoryBadges;

// Re-export helpers for external filtering usage
export function getKeywordsForSubcategory(id: string): string[] {
  return SUBCATEGORY_KEYWORDS[id] || [];
}
