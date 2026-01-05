import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  process.env.GRAPHQL_ENDPOINT ||
  'https://master.shamanicca.com/graphql';

const httpLink = new HttpLink({
  uri: endpoint,
  credentials: 'same-origin',
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
