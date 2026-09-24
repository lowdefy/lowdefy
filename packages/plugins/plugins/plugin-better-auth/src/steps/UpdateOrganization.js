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

import { type } from '@lowdefy/helpers';

import callPluginEndpoint from './support/callPluginEndpoint.js';

// Writes the organization row's display data - name, logo and metadata - and
// nothing that anything else keys off.
//
// slug is refused. Under the "pinned" policy the organization's id IS its slug
// (ensureOrganization creates the row with id: slug and refuses a row keyed any
// other way), so one slug write would rename the value every member row,
// invitation and module read match against, orphaning all of them in a single
// call. The refusal is uniform across both policies rather than conditional on
// the active one: a property surface that appears and disappears with a config
// value is harder to reason about than an out-of-band rename, and a tenant
// deployment owes the same member-row rewrite either way.
//
// There is no companion delete step. owner's one statement beyond admin's is
// organization: ['delete'], and deleting the organization a pinned deployment is
// bound to strands the deployment rather than tidying it.
//
// The endpoint takes the fields nested under a data key, not flat, and applies
// only the keys data carries - so an omitted field is left as it is rather than
// cleared. Steps reach plugin.endpoints directly instead of going through the
// router, which is why this works under the "pinned" policy at all:
// /organization/update is one of the client paths that policy disables.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function UpdateOrganization({ acting, auth, organizationId, properties }) {
  const { logo, metadata, name, slug } = properties;
  if (!type.isNone(slug)) {
    throw new Error(
      'UpdateOrganization refuses a "slug" property - under the "pinned" organizations policy the ' +
        'organization id is its slug, so changing it strands every member row and invitation ' +
        'pointing at the old value.'
    );
  }
  if (!type.isNone(name) && !type.isString(name)) {
    throw new Error('UpdateOrganization requires a "name" string property.');
  }
  if (!type.isNone(logo) && !type.isString(logo)) {
    throw new Error('UpdateOrganization requires a "logo" string property.');
  }
  if (!type.isNone(metadata) && !type.isObject(metadata)) {
    throw new Error('UpdateOrganization requires a "metadata" object property.');
  }

  const data = {};
  if (!type.isNone(name)) {
    data.name = name;
  }
  if (!type.isNone(logo)) {
    data.logo = logo;
  }
  if (!type.isNone(metadata)) {
    data.metadata = metadata;
  }
  // A call naming no field is a write with nothing to write; refused here rather
  // than round-tripped so the author hears about the empty step instead of
  // reading a success for a change that never happened.
  if (Object.keys(data).length === 0) {
    throw new Error(
      'UpdateOrganization requires at least one of the "name", "logo" or "metadata" properties.'
    );
  }

  return callPluginEndpoint({
    acting,
    auth,
    body: { data, organizationId },
    endpointKey: 'updateOrganization',
    pluginId: 'organization',
  });
}

// Writing the organization row needs organization:update authority in that
// organization, which owner and admin both hold and member does not. No
// targetUser: the write lands on the organization row, not on a user row shared
// by the whole deployment.
UpdateOrganization.meta = {
  authority: { scope: 'org', permissions: { organization: ['update'] } },
};

export default UpdateOrganization;
