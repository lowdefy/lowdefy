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

import { gql } from 'apollo-server';

const typeDefs = gql`
  scalar JSON
  type Query {
    authenticated: Boolean
    lowdefyGlobal: JSON
    menu: MenuResponse
    openIdAuthorizationUrl(openIdAuthorizationUrlInput: OpenIdAuthorizationUrlInput!): String
    openIdCallback(openIdCallbackInput: OpenIdCallbackInput!): OpenIdCallbackResponse
    openIdLogoutUrl(openIdLogoutUrlInput: OpenIdLogoutUrlInput!): String
    page(pageId: ID!): JSON
    request(input: RequestInput!): RequestResponse
  }

  input RequestInput {
    arrayIndices: JSON!
    blockId: String!
    event: JSON!
    input: JSON!
    lowdefyGlobal: JSON!
    pageId: String!
    requestId: String!
    state: JSON!
    urlQuery: JSON!
  }

  type MenuResponse {
    menus: [Menu]
    homePageId: String
    initPageId: String
  }

  type Menu {
    id: ID!
    menuId: String
    properties: JSON
    links: [MenuItem]
  }

  union MenuItem = MenuGroup | MenuLink

  type MenuGroup {
    id: ID
    type: String
    properties: JSON
    links: [MenuItem]
  }

  type MenuLink {
    id: ID
    type: String
    properties: JSON
    pageId: String
    url: String
  }

  input OpenIdAuthorizationUrlInput {
    authUrlQueryParams: JSON
    input: JSON
    pageId: String
    urlQuery: JSON
  }

  input OpenIdCallbackInput {
    code: String!
    state: String!
  }

  type OpenIdCallbackResponse {
    idToken: String
    input: JSON
    pageId: String
    urlQuery: JSON
  }

  input OpenIdLogoutUrlInput {
    idToken: String
  }

  type RequestResponse {
    id: ID!
    type: String
    success: Boolean
    response: JSON
  }
`;

export default typeDefs;
