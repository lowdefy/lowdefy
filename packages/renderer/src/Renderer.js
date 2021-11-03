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

import React, { useState } from 'react';
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
import parseJwt from './utils/auth/parseJwt';

const lowdefy = {
  basePath: window.lowdefy.basePath,
  contexts: {},
  displayMessage: () => () => undefined,
  document,
  imports: {
    jsActions: window.lowdefy.imports.jsActions,
    jsOperators: window.lowdefy.imports.jsOperators,
  },
  inputs: {},
  link: () => {},
  localStorage,
  registerJsAction: window.lowdefy.registerJsAction,
  registerJsOperator: window.lowdefy.registerJsOperator,
  updaters: {},
  window,
};

delete window.lowdefy.imports;
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
    authenticated
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
      initPageId
    }
  }
`;

const RootQuery = ({ children, lowdefy }) => {
  const { data, loading, error } = useQuery(GET_ROOT);
  if (loading) return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  if (error) return <h1>Error</h1>;

  lowdefy.homePageId = get(data, 'menu.homePageId');
  lowdefy.initPageId = get(data, 'menu.initPageId');
  // Make a copy to avoid immutable error when calling setGlobal.
  lowdefy.lowdefyGlobal = JSON.parse(JSON.stringify(get(data, 'lowdefyGlobal', { default: {} })));
  lowdefy.menus = get(data, 'menu.menus');

  if (data.authenticated) {
    const idToken = lowdefy.localStorage.getItem('idToken');
    if (!idToken) {
      // User is authenticated but has removed idToken from localStorage.
      lowdefy.auth.logout();
    }
    // eslint-disable-next-line no-unused-vars
    const { iat, exp, aud, iss, ...user } = parseJwt(idToken);
    lowdefy.user = user;
  }
  return <>{children}</>;
};

const Home = ({ lowdefy }) => {
  const { search } = useLocation();
  if (lowdefy.homePageId) {
    return <Redirect to={{ pathname: `${lowdefy.basePath}/${lowdefy.homePageId}`, search }} />;
  }
  return <Redirect to={`${lowdefy.basePath}/404`} />;
};

const PageLoader = ({ lowdefy }) => {
  const { initPageId } = lowdefy;
  const [initEventsTriggered, setInitEventsTriggered] = useState(false);

  if (!initPageId || initEventsTriggered) {
    return <Page lowdefy={lowdefy} initEventsTriggered={setInitEventsTriggered} />;
  } else {
    return (
      <Page lowdefy={lowdefy} pageId={initPageId} initEventsTriggered={setInitEventsTriggered} />
    );
  }
};

const Root = ({ gqlUri }) => {
  lowdefy.updateBlock = (blockId) => lowdefy.updaters[blockId] && lowdefy.updaters[blockId]();
  lowdefy.client = useGqlClient({ gqlUri, lowdefy });
  lowdefy.auth = {
    login: createLogin(lowdefy),
    logout: createLogout(lowdefy),
  };
  lowdefy.user = {};
  return (
    <ErrorBoundary fullPage>
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
            <Route exact path={`${lowdefy.basePath}/`}>
              <Home lowdefy={lowdefy} />
            </Route>
            <Route exact path={`${lowdefy.basePath}/auth/openid-callback`}>
              <OpenIdCallback lowdefy={lowdefy} />
            </Route>
            <Route exact path={`${lowdefy.basePath}/:pageId`}>
              <PageLoader lowdefy={lowdefy} />
            </Route>
          </Switch>
        </RootQuery>
      </ApolloProvider>
    </ErrorBoundary>
  );
};

const Renderer = ({ gqlUri }) => (
  <BrowserRouter>
    <Root gqlUri={gqlUri} />
  </BrowserRouter>
);

export default Renderer;
