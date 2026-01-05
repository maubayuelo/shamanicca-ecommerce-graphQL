export function pickImage(node: any, sizeName: string): string | null {
  const sizes = node?.featuredImage?.node?.mediaDetails?.sizes || [];
  const match = Array.isArray(sizes) ? sizes.find((s: any) => s?.name === sizeName) : undefined;
  return match?.sourceUrl || node?.featuredImage?.node?.sourceUrl || null;
}
