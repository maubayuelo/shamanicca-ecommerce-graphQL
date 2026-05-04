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
