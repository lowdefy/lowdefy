import React from 'react';
import { ApolloProvider } from '@apollo/client';
import useGqlClient from './utils/useGqlClient';
import Page from './Page';

// const RemoteButton = React.lazy(() => import('block/Button'));

const Engine = () => {
  const client = useGqlClient();
  return (
    <ApolloProvider client={client}>
      <h2>App</h2>
      <Page />
    </ApolloProvider>
  );
};

export default Engine;
