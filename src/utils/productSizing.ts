/**
 * Determines if a product should have size options
 * Only certain product types come in multiple sizes:
 * - Tees
 * - Hoodies
 * - Sweatshirts
 * - iPhone Cases
 */
export function productRequiresSizing(productName: string): boolean {
  const sizedProductKeywords = ['tee', 'hoodie', 'sweater', 'iphone case'];
  const lowerName = productName.toLowerCase();

  return sizedProductKeywords.some((keyword) => lowerName.includes(keyword));
}

/**
 * Determines if a product is a unique size product
 * Products like jackets, boots, accessories typically come in one size per item
 */
export function isUniqueSizeProduct(productName: string): boolean {
  return !productRequiresSizing(productName);
}
