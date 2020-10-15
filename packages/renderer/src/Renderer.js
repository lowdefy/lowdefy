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

import React from 'react';
import { BrowserRouter, Route, Redirect, Switch, useLocation } from 'react-router-dom';
import { ApolloProvider, useQuery, gql } from '@apollo/client';

import { ErrorBoundary } from '@lowdefy/block-tools';
import get from '@lowdefy/get';

import useGqlClient from './utils/graphql/useGqlClient';
import Page from './page/Page';

// eslint-disable-next-line no-undef
const windowContext = window;
// eslint-disable-next-line no-undef
const documentContext = document;

const Components = {};
const contexts = {};
const input = {};

const GET_ROOT = gql`
  fragment MenuLinkFragment on MenuLink {
    id
    type
    properties
    pageId
    url
  }
  query getRoot {
    lowdefyGlobal
    menu {
      menus {
        id
        menuId
        properties
        links {
          ...MenuLinkFragment
          ... on MenuGroup {
            id
            type
            properties
            links {
              ... on MenuGroup {
                id
                type
                properties
                links {
                  ...MenuLinkFragment
                }
              }
              ...MenuLinkFragment
            }
          }
        }
      }
      homePageId
    }
  }
`;

const RootContext = ({ children, client }) => {
  const { data, loading, error } = useQuery(GET_ROOT);
  if (error) return <h1>Error</h1>;
  if (loading) return <h1>Loading Root Context</h1>;

  return (
    <>
      {children({
        client,
        Components,
        contexts,
        document: documentContext,
        homePageId: get(data, 'menu.homePageId'),
        input,
        lowdefyGlobal: JSON.parse(JSON.stringify(get(data, 'lowdefyGlobal', { default: {} }))),
        menus: get(data, 'menu.menus'),
        displayMessage: {
          loading: (message) => {
            console.log('Start loading', message);
            return () => {
              console.log('End loading');
            };
          },
          error: (message) => console.log(message),
          success: (message) => console.log(message),
        },
        window: windowContext,
      })}
    </>
  );
};

const Home = ({ rootContext }) => {
  const { search } = useLocation();
  if (rootContext.homePageId) {
    return <Redirect to={{ pathname: `/${rootContext.homePageId}`, search }} />;
  }
  return <Redirect to="/404" />;
};

const Root = () => {
  const client = useGqlClient();
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <RootContext client={client}>
          {(rootContext) => {
            return (
              <>
                <Switch>
                  <Route exact path="/">
                    <Home rootContext={rootContext} />
                  </Route>
                  <Route exact path="/:pageId">
                    <ErrorBoundary>
                      <Page rootContext={rootContext} />
                    </ErrorBoundary>
                  </Route>
                </Switch>
              </>
            );
          }}
        </RootContext>
      </ApolloProvider>
    </ErrorBoundary>
  );
};

const Engine = () => (
  <BrowserRouter>
    <Root />
  </BrowserRouter>
);

export default Engine;
