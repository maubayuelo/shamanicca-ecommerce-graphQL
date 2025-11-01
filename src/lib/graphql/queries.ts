import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($first: Int = 10) {
    products(first: $first) {
      nodes {
        id
        name
        slug
        price
        shortDescription
        image {
          sourceUrl
        }
      }
    }
  }
`;
