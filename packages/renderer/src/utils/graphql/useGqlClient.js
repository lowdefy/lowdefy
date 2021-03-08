/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { makeContextId } from '@lowdefy/engine';

const cache = new InMemoryCache({
  possibleTypes: {
    MenuItem: ['MenuLink', 'MenuGroup'],
  },
});
const retryLink = new RetryLink();

const httpLink = ({ uri = 'api/graphql' }) => new HttpLink({ uri, credentials: 'same-origin' });

// TODO: Handle errors
const errorHandler = ({ localStore, rootHandle }) => ({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((err) => {
      switch (err.extensions.code) {
        case 'TOKEN_EXPIRED':
          rootHandle.root.user = {};
          localStore.setItem(`tokenId`, '');
          if (rootHandle.root.auth) {
            // async ?
            rootHandle.root.auth.login({
              pageId: rootHandle.root.pageId,
              urlQuery: rootHandle.root.urlQuery,
              input:
                rootHandle.root.input[
                  makeContextId({
                    blockId: rootHandle.root.pageId,
                    pageId: rootHandle.root.pageId,
                    urlQuery: rootHandle.root.urlQuery,
                  })
                ],
            });
          }
          return;
        case 'UNAUTHENTICATED':
          rootHandle.user = {};
          localStore.setItem(`tokenId`, '');
          return;
        default:
          console.log('graphQLErrors', graphQLErrors);
      }
    });
  }
  console.log('networkError', networkError);
  return;
};

const useGqlClient = ({ gqlUri, localStore, rootHandle }) => {
  const [client, setClient] = useState(null);
  if (!client) {
    const clt = new ApolloClient({
      link: ApolloLink.from([
        retryLink,
        onError(errorHandler({ localStore, rootHandle })),
        httpLink({ uri: gqlUri }),
      ]),
      cache,
      resolvers,
      typeDefs,
    });
    setClient(clt);
  }
  return client;
};

export default useGqlClient;
