/*
   Copyright 2020 Lowdefy, Inc

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { useState } from 'react';
import { ApolloLink, HttpLink } from '@apollo/client';
import { ApolloClient } from '@apollo/client/core';
import { InMemoryCache } from '@apollo/client/cache';
import { onError } from '@apollo/link-error';
import { RetryLink } from '@apollo/link-retry';
import { typeDefs, resolvers } from './schema';

const cache = new InMemoryCache({
  possibleTypes: {
    MenuItem: ['MenuLink', 'MenuGroup'],
  },
});
const retryLink = new RetryLink();

// TODO: make uri configurable
const httpLink = new HttpLink({
  uri: process.env.GRAPHQL_URI,
});

// TODO: Handle errors
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
      resolvers,
      typeDefs,
    });
    setClient(clt);
  }
  return client;
};

export default useGqlClient;
