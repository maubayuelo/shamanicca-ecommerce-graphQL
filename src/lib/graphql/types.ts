/**
 * types.ts — Shared response shapes for raw GraphQL query results
 *
 * These describe the `data` object returned by `client.query<T>()` for the
 * shared queries in queries.ts. Kept separate from queries.ts so they can be
 * imported by both pages and API routes without pulling in `gql` tags.
 */

export type ProductImage = {
  sourceUrl?: string;
  mediaDetails?: { sizes?: Array<{ name?: string; sourceUrl?: string }> };
};

// Shape returned by GET_PRODUCTS and GET_PRODUCTS_BY_CATEGORY (same node fields).
export type ProductNode = {
  id: string;
  databaseId?: number;
  name: string;
  slug: string;
  shortDescription?: string;
  image?: ProductImage | null;
  price?: string;
  regularPrice?: string;
};

export type GetProductsData = {
  products?: { nodes?: ProductNode[] };
};

// Shape returned by GET_CATEGORIES.
export type CategoryNode = {
  databaseId: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parentDatabaseId?: number;
};

export type GetCategoriesData = {
  categories?: { nodes?: CategoryNode[] };
};

// Shape returned by GET_PRODUCT_CATEGORIES (same as CategoryNode plus menuOrder).
export type ProductCategoryNode = CategoryNode & {
  menuOrder?: number;
};

export type GetProductCategoriesData = {
  productCategories?: { nodes?: ProductCategoryNode[] };
};
