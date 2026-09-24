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

// organizationId and organizationSlug are both part of the authored property
// surface, and the floor resolves either of them - or the pinned default - to
// the id passed in here. Only that id is forwarded: sending the slug on as well
// would let the endpoint read a different organization from the one the floor
// authorized the caller in.
async function ListMembers({ acting, auth, organizationId, properties }) {
  const { filterField, filterOperator, filterValue, limit, offset, sortBy, sortDirection } =
    properties;
  return callPluginEndpoint({
    acting,
    auth,
    endpointKey: 'listMembers',
    pluginId: 'organization',
    query: {
      filterField,
      filterOperator,
      filterValue,
      limit,
      offset,
      organizationId,
      sortBy,
      sortDirection,
    },
  });
}

// Reading an organization's member list needs member:list authority in that
// organization - the list is scoped to one organization, so the caller's
// authority there is the whole bound.
ListMembers.meta = {
  authority: { scope: 'org', permissions: { member: ['list'] } },
};

export default ListMembers;
