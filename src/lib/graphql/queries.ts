import { gql } from '@apollo/client';

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
      title(format: RENDERED)
      excerpt(format: RENDERED)
      content(format: RENDERED)
      categories { nodes { databaseId name slug } }
      featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
    }
  }
`;

// Blog: posts by category slug (using offset pagination when available)
export const GET_POSTS_BY_CATEGORY_SLUG = gql`
  query GetPostsByCategory($slug: String!, $first: Int = 9, $offset: Int = 0) {
    categories(where: { slugIn: [$slug] }) {
      nodes {
        databaseId
        name
        slug
        description
        count
      }
    }
    posts(
      where: { categoryName: $slug, offsetPagination: { offset: $offset, size: $first }, orderby: { field: DATE, order: DESC } }
    ) {
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

// All posts with total count for robust pagination (when offsetPagination is available)
export const GET_ALL_POSTS_WITH_TOTAL = gql`
  query GetAllPostsWithTotal($size: Int!, $offset: Int!) {
    posts(where: { offsetPagination: { size: $size, offset: $offset }, orderby: { field: DATE, order: DESC } }) {
      pageInfo {
        offsetPagination { total }
      }
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

// Category posts with total count (category details + posts with offsetPagination total)
export const GET_CATEGORY_POSTS_WITH_TOTAL = gql`
  query GetCategoryPostsWithTotal($slug: String!, $size: Int!, $offset: Int!) {
    categories(where: { slugIn: [$slug] }) {
      nodes { databaseId name slug description count }
    }
    posts(where: { categoryName: $slug, offsetPagination: { size: $size, offset: $offset }, orderby: { field: DATE, order: DESC } }) {
      pageInfo { offsetPagination { total } }
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

// Cursor-based: fetch a page of all posts
export const GET_ALL_POSTS_CURSOR = gql`
  query GetAllPostsCursor($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
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
export const GET_CATEGORY_POSTS_CURSOR = gql`
  query GetCategoryPostsCursor($slug: ID!, $first: Int!, $after: String) {
    category(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      description
      posts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
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

// Category by slug to retrieve ID and metadata
export const GET_CATEGORY_BY_SLUG = gql`
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      description
      count
    }
  }
`;

// Child categories of a given parent
export const GET_CHILD_CATEGORIES = gql`
  query GetChildCategories($parentId: Int!, $first: Int = 100) {
    categories(first: $first, where: { parent: $parentId, hideEmpty: false }) {
      nodes { databaseId name slug }
    }
  }
`;

// Posts by category using taxQuery (includes children) with offsetPagination
export const GET_POSTS_BY_CATEGORY_ID_WITH_TOTAL = gql`
  query GetPostsByCategoryIdWithTotal($categoryId: [ID]!, $size: Int!, $offset: Int!) {
    posts(
      where: {
        taxQuery: {
          relation: AND
          taxArray: [
            { taxonomy: CATEGORY, terms: $categoryId, field: TERM_ID, operator: IN, includeChildren: true }
          ]
        }
        offsetPagination: { size: $size, offset: $offset }
        orderby: { field: DATE, order: DESC }
      }
    ) {
      pageInfo { offsetPagination { total } }
      nodes {
        databaseId
        slug
        title(format: RENDERED)
        excerpt(format: RENDERED)
        featuredImage { node { sourceUrl mediaDetails { sizes { name sourceUrl } } } }
        categories { nodes { databaseId name slug } }
      }
    }
  }
`;
