/**
 * utils.ts — GraphQL response utility helpers
 *
 * WordPress/WooCommerce images come back from the API with multiple sizes
 * pre-generated (thumbnail, medium, large, full, etc.).
 *
 * Example API response for a product image:
 * {
 *   sourceUrl: "https://example.com/image.jpg",   ← full size
 *   mediaDetails: {
 *     sizes: [
 *       { name: "thumbnail", sourceUrl: "https://.../image-150x150.jpg" },
 *       { name: "medium",    sourceUrl: "https://.../image-300x300.jpg" },
 *       { name: "large",     sourceUrl: "https://.../image-1024x1024.jpg" },
 *     ]
 *   }
 * }
 *
 * These helpers extract the right size URL, with fallbacks so we never
 * get a broken image if a size wasn't generated.
 */

// Pick a named size from a WP featuredImage node; falls back to full sourceUrl
export function pickImage(node: any, sizeName: string): string | null {
  const sizes = node?.featuredImage?.node?.mediaDetails?.sizes || [];
  const match = Array.isArray(sizes) ? sizes.find((s: any) => s?.name === sizeName) : undefined;
  return match?.sourceUrl || node?.featuredImage?.node?.sourceUrl || null;
}

type WPSizes = Array<{ name?: string | null; sourceUrl?: string | null }> | null | undefined;

// Pick a named size from a WP mediaDetails.sizes array (product images, gallery images)
export function pickSize(
  sizes: WPSizes,
  sizeName: string,
  fallback?: string | null,
): string | null {
  return sizes?.find((s) => s.name === sizeName)?.sourceUrl ?? fallback ?? null;
}
