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

import GraphQLJSON from 'graphql-type-json';

import lowdefyGlobal from './queries/lowdefyGlobal/lowdefyGlobal';
import menu from './queries/menu/menu';
import openIdAuthorizationUrl from './queries/auth/openIdAuthorizationUrl';
import openIdCallback from './queries/auth/openIdCallback';
import openIdLogoutUrl from './queries/auth/openIdLogoutUrl';
import page from './queries/page/page';
import request from './queries/request/request';

function resolveMenuItem(menuItem) {
  if (menuItem.type === 'MenuLink') {
    return 'MenuLink';
  }
  return 'MenuGroup';
}

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    lowdefyGlobal,
    menu,
    openIdAuthorizationUrl,
    openIdCallback,
    openIdLogoutUrl,
    page,
    request,
  },
  MenuItem: {
    __resolveType: resolveMenuItem,
  },
};

export default resolvers;
