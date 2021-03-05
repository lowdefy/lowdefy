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
import { gql } from '@apollo/client';
import { get, urlQuery as urlQueryFn } from '@lowdefy/helpers';

import parseJwt from './parseJwt';
import setupLink from '../setupLink';

const OPENID_CALLBACK = gql`
  query openIdCallback($openIdCallbackInput: OpenIdCallbackInput!) {
    openIdCallback(openIdCallbackInput: $openIdCallbackInput) {
      idToken
      input
      pageId
      urlQuery
    }
  }
`;

const GET_MENU = gql`
  fragment MenuLinkFragment on MenuLink {
    id
    type
    properties
    pageId
    url
  }
  query getRoot {
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

async function openIdCallbackFn({ rootContext, routeHistory, search }) {
  const { code, state, error, error_description } = urlQueryFn.parse(search.slice(0) || '');

  if (error) {
    if (error_description) throw new Error(error_description);
    throw new Error(error);
  }

  if (!code || !state) throw new Error('Authentication error.');
  const { data } = await rootContext.client.query({
    query: OPENID_CALLBACK,
    fetchPolicy: 'network-only',
    variables: {
      openIdCallbackInput: {
        code,
        state,
      },
    },
  });

  const idToken = get(data, 'openIdCallback.idToken');
  if (!idToken) throw new Error('Authentication error.');
  rootContext.window.localStorage.setItem('idToken', idToken);

  // eslint-disable-next-line no-unused-vars
  const { iat, exp, aud, iss, ...user } = parseJwt(idToken);
  rootContext.user = user;

  const { data: menuData } = await rootContext.client.query({
    query: GET_MENU,
    fetchPolicy: 'network-only',
  });
  rootContext.homePageId = get(menuData, 'menu.homePageId');
  rootContext.menus = get(menuData, 'menu.menus');

  rootContext.link = setupLink({ rootContext, routeHistory });
  const { pageId, input, urlQuery } = data.openIdCallback;
  if (pageId) {
    rootContext.link({ pageId, input, urlQuery });
  } else {
    rootContext.link({ input, home: true, urlQuery });
  }
}

export default openIdCallbackFn;
