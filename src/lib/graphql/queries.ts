/**
 * queries.ts — All GraphQL query definitions for this app
 *
 * GraphQL queries are written inside `gql` template literals.
 * The `gql` tag from Apollo parses the query string into an AST
 * (Abstract Syntax Tree) that Apollo can send to the server.
 *
 * HOW QUERIES WORK:
 *  1. You write a query describing exactly what data you need
 *  2. Apollo sends it to the GraphQL endpoint (WPGraphQL on WordPress)
 *  3. The server returns only the fields you asked for — nothing more
 *
 * NAMING CONVENTION:
 *  - GET_*     → queries that fetch data (read-only)
 *  - SEARCH_*  → queries that filter/search data
 *
 * WPGraphQL supports two types of content from WordPress:
 *  - Products (from WooCommerce) — shop items
 *  - Posts/Categories (from WordPress) — blog content
 */

import { gql } from '@apollo/client';

// Fetch a list of products (all types).
// Uses a GraphQL "union" (... on SimpleProduct, ... on VariableProduct) because
// WooCommerce has multiple product types — each has slightly different fields.
export const GET_PRODUCTS = gql`
  query GetProducts($first: Int = 10) {
    products(first: $first) {
      nodes {
        id
        name
        slug
        shortDescription
        image {
          sourceUrl
          mediaDetails { sizes { name sourceUrl } }
        }
        ... on SimpleProduct { price regularPrice }
        ... on VariableProduct { price regularPrice }
        ... on ExternalProduct { price regularPrice }
        ... on GroupProduct { price regularPrice }
        ... on ProductWithPricing { price regularPrice }
      }
    }
  }
`;

// WooCommerce: products by category slug
export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($category: String!, $first: Int = 100) {
    products(first: $first, where: { category: $category }) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        image {
          sourceUrl
          mediaDetails { sizes { name sourceUrl } }
        }
        ... on SimpleProduct { price regularPrice }
        ... on VariableProduct { price regularPrice }
        ... on ExternalProduct { price regularPrice }
        ... on GroupProduct { price regularPrice }
        ... on ProductWithPricing { price regularPrice }
      }
    }
  }
`;

// WooCommerce: single product by slug
export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      shortDescription
      image {
        sourceUrl
        mediaDetails {
          sizes {
            sourceUrl
            name
          }
        }
      }
      galleryImages {
        nodes {
          sourceUrl
          mediaDetails {
            sizes {
              sourceUrl
              name
            }
          }
        }
      }
      productCategories {
        nodes {
          name
          slug
          parent {
            node {
              name
              slug
            }
          }
        }
      }
      ... on SimpleProduct {
        price
        regularPrice
        onSale
        stockStatus
      }
      ... on VariableProduct {
        price
        regularPrice
        onSale
        attributes {
          nodes {
            name
            options
          }
        }
        variations {
          nodes {
            name
            price
            stockStatus
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

// WooCommerce: get product slugs for static generation
export const GET_PRODUCT_SLUGS = gql`
  query GetProductSlugs($first: Int = 100) {
    products(first: $first) {
      nodes {
        slug
      }
    }
  }
`;

// WooCommerce: search products by keyword
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String!, $first: Int = 9) {
    products(first: $first, where: { search: $search }) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        image {
          sourceUrl
          mediaDetails { sizes { name sourceUrl } }
        }
        ... on SimpleProduct { price regularPrice }
        ... on VariableProduct { price regularPrice }
        ... on ExternalProduct { price regularPrice }
        ... on GroupProduct { price regularPrice }
        ... on ProductWithPricing { price regularPrice }
      }
    }
  }
`;

// Blog: posts list with cursor pagination
export const GET_BLOG_POSTS = gql`
  query GetBlogPosts($first: Int = 15, $after: String) {
    posts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        slug
        date
        title(format: RENDERED)
        excerpt(format: RENDERED)
        content(format: RENDERED)
        categories { nodes { databaseId name slug } }
        featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
      }
    }
  }
`;

// Blog: post slugs for static paths
export const GET_POST_SLUGS = gql`
  query GetPostSlugs($first: Int = 50) {
    posts(first: $first) {
      nodes { slug }
    }
  }
`;

// Blog: categories list
export const GET_CATEGORIES = gql`
  query GetCategories($first: Int = 100) {
    categories(first: $first, where: { hideEmpty: false }) {
      nodes { databaseId name slug description count parentDatabaseId }
    }
  }
`;

// Blog: single post by slug
export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      databaseId
      slug
      date
      modified
      title(format: RENDERED)
      excerpt(format: RENDERED)
      content(format: RENDERED)
      categories { nodes { databaseId name slug } }
      featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
    }
  }
`;

// Blog: search posts
export const SEARCH_POSTS = gql`
  query SearchPosts($query: String!, $first: Int = 9, $after: String) {
    posts(first: $first, after: $after, where: { search: $query, orderby: { field: DATE, order: DESC } }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        slug
        title(format: RENDERED)
        excerpt(format: RENDERED)
        featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
      }
    }
  }
`;

// Cursor-based: fetch a page of posts within a category by slug
// Blog listings, paged from ids (see utils/paginate.ts). WordPress keeps a
// curated post order that `orderby` does not change, while WPGraphQL cursors
// filter by date, so cursor walking repeats posts. One query lists every id in
// the site's own order (WPGraphQL returns at most 100 nodes per request), a
// second loads the posts of the current page in exactly that order.
export const GET_POST_IDS = gql`
  query GetPostIds($first: Int!) {
    posts(first: $first) {
      nodes { databaseId date }
    }
  }
`;
export const GET_CATEGORY_POST_IDS = gql`
  query GetCategoryPostIds($slug: ID!, $first: Int!) {
    category(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      description
      count
      posts(first: $first) {
        nodes { databaseId date }
      }
    }
  }
`;
export const GET_POSTS_BY_IDS = gql`
  query GetPostsByIds($in: [ID], $first: Int!) {
    posts(first: $first, where: { in: $in, orderby: { field: IN, order: ASC } }) {
      nodes {
        databaseId
        slug
        title(format: RENDERED)
        excerpt(format: RENDERED)
        featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
      }
    }
  }
`;
export const GET_CATEGORY_POSTS_CURSOR = gql`
  query GetCategoryPostsCursor($slug: ID!, $first: Int!, $after: String, $notIn: [ID]) {
    category(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      description
      posts(first: $first, after: $after, where: { notIn: $notIn, orderby: { field: DATE, order: DESC } }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId
          slug
          title(format: RENDERED)
          excerpt(format: RENDERED)
          featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
        }
      }
    }
  }
`;

// WooCommerce: product categories
export const GET_PRODUCT_CATEGORIES = gql`
  query GetProductCategories($first: Int = 100) {
    productCategories(first: $first, where: { hideEmpty: false }) {
      nodes {
        databaseId
        name
        slug
        description
        count
        parentDatabaseId
        menuOrder
      }
    }
  }
`;

// Blog: affiliated banner for a category, by databaseId
export const GET_CATEGORY_BANNER = gql`
  query GetCategoryBanner($id: ID!) {
    category(id: $id, idType: DATABASE_ID) {
      affiliatedBanner {
        bannerType
        bannerHeadline
        bannerSubtext
        bannerCtaLabel
        bannerCtaUrl
        openInNewTab
        bannerEnabled
        bannerImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
      }
    }
  }
`;

// Blog: global fallback affiliated banner from the "Site Settings" page
export const GET_SITE_SETTINGS_BANNER = gql`
  query GetSiteSettingsBanner {
    page(id: "site-settings", idType: URI) {
      affiliatedBanner {
        bannerType
        bannerHeadline
        bannerSubtext
        bannerCtaLabel
        bannerCtaUrl
        openInNewTab
        bannerEnabled
        bannerImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
      }
    }
  }
`;

// Site settings: top novelties announcement banner.
export const GET_SITE_SETTINGS_ANNOUNCEMENT = gql`
  query GetSiteSettingsAnnouncement {
    page(id: "site-settings", idType: URI) {
      siteSettings {
        topNoveltiesBanner {
          bannerText
          bannerCtaLabel
          bannerCtaUrl
          bannerEnabled
        }
      }
    }
  }
`;

// Fetch home page banners from ACF
export const GET_HOME_BANNERS = gql`
  query GetHomeBanners {
    page(id: "home", idType: URI) {
      homePageBanners {
        homeBanners {
          bannerImage {
            node {
              mediaItemUrl
              sourceUrl
            }
          }
          bannerTitle
          bannerSubtitle
          bannerHref
        }
      }
    }
  }
`;
