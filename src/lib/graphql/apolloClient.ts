/**
 * apolloClient.ts — Sets up the Apollo Client instance
 *
 * Apollo Client is the library that manages GraphQL queries in this app.
 * It needs to know:
 *  1. WHERE to send queries (the GraphQL endpoint URL)
 *  2. HOW to cache results (InMemoryCache — stores responses in memory so
 *     re-running the same query returns instantly without a network request)
 *
 * This client is created ONCE and shared across the entire app via
 * <ApolloProvider client={client}> in _app.tsx.
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Resolve the GraphQL endpoint from environment variables.
// Falls back from most specific to least specific, with a hardcoded default.
// NEXT_PUBLIC_ variables are available in both server and browser environments.
const endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  process.env.GRAPHQL_ENDPOINT ||
  'https://master.shamanicca.com/graphql';

// HttpLink tells Apollo HOW to send requests — standard HTTP POST to the endpoint.
// credentials: 'same-origin' sends cookies only when the request is on the same domain.
const httpLink = new HttpLink({
  uri: endpoint,
  credentials: 'same-origin',
});

// Create the Apollo Client instance.
// - link: the transport layer (how to send queries)
// - cache: where to store query results to avoid re-fetching
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
