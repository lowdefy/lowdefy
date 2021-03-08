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

import React from 'react';
import { BrowserRouter, Route, Redirect, Switch, useLocation } from 'react-router-dom';
import { ApolloProvider, useQuery, gql } from '@apollo/client';

import { ErrorBoundary, Loading } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';

import useGqlClient from './utils/graphql/useGqlClient';
import createLogin from './utils/auth/createLogin';
import createLogout from './utils/auth/createLogout';
import OpenIdCallback from './utils/auth/OpenIdCallback';
import DisplayMessage from './page/DisplayMessage';
import Page from './page/Page';
import createUpdateBlock from './page/block/updateBlock';
import parseJwt from './utils/auth/parseJwt';

const lowdefy = {
  contexts: {},
  displayMessage: () => () => undefined,
  document,
  inputs: {},
  link: () => {},
  localStorage,
  window,
};

if (window.location.origin.includes('http://localhost')) {
  window.lowdefy = lowdefy;
}

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

const RootQuery = ({ children, lowdefy }) => {
  const { data, loading, error } = useQuery(GET_ROOT);
  if (loading) return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  if (error) return <h1>Error</h1>;

  lowdefy.homePageId = get(data, 'menu.homePageId');
  lowdefy.lowdefyGlobal = JSON.parse(JSON.stringify(get(data, 'lowdefyGlobal', { default: {} })));
  lowdefy.menus = get(data, 'menu.menus');

  return <>{children}</>;
};

const Home = ({ lowdefy }) => {
  const { search } = useLocation();
  if (lowdefy.homePageId) {
    return <Redirect to={{ pathname: `/${lowdefy.homePageId}`, search }} />;
  }
  return <Redirect to="/404" />;
};

const Root = ({ gqlUri }) => {
  lowdefy.client = useGqlClient({ gqlUri, lowdefy });
  lowdefy.auth = {
    login: createLogin(lowdefy),
    logout: createLogout(lowdefy),
  };
  lowdefy.updateBlock = createUpdateBlock(lowdefy.client);
  lowdefy.user = {};
  const idToken = lowdefy.localStorage.getItem('idToken');
  if (idToken) {
    lowdefy.user = parseJwt(idToken);
  }
  return (
    <ErrorBoundary>
      <ApolloProvider client={lowdefy.client}>
        <RootQuery lowdefy={lowdefy}>
          <DisplayMessage
            methods={{
              registerMethod: (_, method) => {
                lowdefy.displayMessage = method;
              },
            }}
          />
          <Switch>
            <Route exact path="/">
              <Home lowdefy={lowdefy} />
            </Route>
            <Route exact path="/auth/openid-callback">
              <OpenIdCallback lowdefy={lowdefy} />
            </Route>
            <Route exact path="/:pageId">
              <ErrorBoundary>
                <Page lowdefy={lowdefy} />
              </ErrorBoundary>
            </Route>
          </Switch>
        </RootQuery>
      </ApolloProvider>
    </ErrorBoundary>
  );
};

const Engine = ({ gqlUri }) => (
  <BrowserRouter>
    <Root gqlUri={gqlUri} />
  </BrowserRouter>
);

export default Engine;
