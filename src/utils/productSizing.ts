/**
 * Hint-based check: returns true when the product name suggests it comes in sizes.
 * This is used only as a secondary fallback when GraphQL returns no variation/attribute
 * data. Prefer checking availableSizes.length > 0 from the actual product data.
 */
export function productRequiresSizing(productName: string): boolean {
  const sizedProductKeywords = [
    't-shirt',
    'tee',
    'hoodie',
    'sweater',
    'sweatshirt',
    'jacket',
    'coat',
    'shirt',
    'iphone case',
    'phone case',
    'leggings',
    'shorts',
    'pants',
    'dress',
    'skirt',
    'crop top',
  ];
  const lowerName = productName.toLowerCase();
  return sizedProductKeywords.some((keyword) => lowerName.includes(keyword));
}

export function isUniqueSizeProduct(productName: string): boolean {
  return !productRequiresSizing(productName);
}
