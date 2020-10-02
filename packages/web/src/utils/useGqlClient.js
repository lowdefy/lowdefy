import { useState } from 'react';
import { ApolloLink, HttpLink } from '@apollo/client';
import { ApolloClient } from '@apollo/client/core';
import { InMemoryCache } from '@apollo/client/cache';
import { onError } from '@apollo/link-error';
import { RetryLink } from '@apollo/link-retry';

const cache = new InMemoryCache();
const retryLink = new RetryLink();
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});
const errorHandler = ({ graphQLErrors, networkError }) => {
  console.log('graphQLErrors', graphQLErrors);
  console.log('networkError', networkError);
};

const useGqlClient = () => {
  const [client, setClient] = useState(null);
  if (!client) {
    const clt = new ApolloClient({
      link: ApolloLink.from([retryLink, onError(errorHandler), httpLink]),
      cache,
    });
    setClient(clt);
  }
  return client;
};

export default useGqlClient;
