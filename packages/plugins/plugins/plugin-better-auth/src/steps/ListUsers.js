/*
  Copyright 2020-2026 Lowdefy, Inc

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

import callPluginEndpoint from './support/callPluginEndpoint.js';

async function ListUsers({ acting, auth, properties }) {
  const {
    filterField,
    filterOperator,
    filterValue,
    limit,
    offset,
    searchField,
    searchOperator,
    searchValue,
    sortBy,
    sortDirection,
  } = properties;
  return callPluginEndpoint({
    acting,
    auth,
    endpointKey: 'listUsers',
    pluginId: 'admin',
    query: {
      filterField,
      filterOperator,
      filterValue,
      limit,
      offset,
      searchField,
      searchOperator,
      searchValue,
      sortBy,
      sortDirection,
    },
  });
}

// system scope: this enumerates the whole users collection, and no per-org check
// can bound a result set that is deliberately unbounded. It has no shipped
// caller - the user-admin module's members list is a native aggregation $matched
// on the organization, not a ListUsers call. An app that wants a
// deployment-wide list writes a system routine and answers for it through its
// own auth.api.roles gate.
ListUsers.meta = { authority: { scope: 'system' } };

export default ListUsers;
