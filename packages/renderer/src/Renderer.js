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
import createLink from './utils/createLink';
import createLogin from './utils/auth/createLogin';
import createLogout from './utils/auth/createLogout';
import OpenIdCallback from './utils/auth/OpenIdCallback';
import DisplayMessage from './page/DisplayMessage';
import Page from './page/Page';
import createUpdateBlock from './page/block/updateBlock';

// eslint-disable-next-line no-undef
const windowContext = window;
// eslint-disable-next-line no-undef
const documentContext = document;

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
  if (loading) return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  if (error) return <h1>Error</h1>;

  return (
    <>
      {children({
        auth: {
          login: createLogin(client, windowContext),
          logout: createLogout(client, windowContext),
        },
        client,
        contexts,
        displayMessage: () => () => undefined,
        document: documentContext,
        getLink: (routeHistory) => createLink({ routeHistory, windowContext, allInputs: input }),
        homePageId: get(data, 'menu.homePageId'),
        input,
        link: () => {},
        lowdefyGlobal: JSON.parse(JSON.stringify(get(data, 'lowdefyGlobal', { default: {} }))),
        menus: get(data, 'menu.menus'),
        updateBlock: createUpdateBlock(client),
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

const Root = ({ gqlUri }) => {
  const client = useGqlClient({ gqlUri });
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <RootContext client={client}>
          {(rootContext) => {
            if (windowContext.location.origin.includes('http://localhost')) {
              windowContext.Lowdefy = { rootContext };
            }
            return (
              <>
                <DisplayMessage
                  methods={{
                    registerMethod: (_, method) => {
                      rootContext.displayMessage = method;
                    },
                  }}
                />
                <Switch>
                  <Route exact path="/">
                    <Home rootContext={rootContext} />
                  </Route>
                  <Route exact path="/auth/openid-callback">
                    <OpenIdCallback rootContext={rootContext} />
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

const Engine = ({ gqlUri }) => (
  <BrowserRouter>
    <Root gqlUri={gqlUri} />
  </BrowserRouter>
);

export default Engine;
