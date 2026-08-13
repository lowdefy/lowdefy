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
import { getOrgAdapter } from 'better-auth/plugins';

import getPluginEndpoint from './support/getPluginEndpoint.js';
import invokeEndpoint from './support/invokeEndpoint.js';

// The engine config sets allowUserToCreateOrganization: false; the endpoint
// bypasses that switch only for "system actions" - a call with NO session, NO
// headers, and an explicit body.userId which becomes the creator/owner. So this
// step must not inject an acting session or pass a headers key at all.
async function CreateOrganization({ acting, auth, properties }) {
  const { userId: propertiesUserId, ...organizationFields } = properties;
  const userId = propertiesUserId ?? acting.user?.id;
  const authContext = await auth.$context;

  // A provisioned organization has no creator - membership arrives by
  // invitation. Without a creator the endpoint cannot serve the write: it
  // requires one and mints them as an owner member. So the row is written
  // straight through the org plugin's own adapter layer, minting no member.
  if (type.isNone(userId)) {
    if (type.isNone(organizationFields.name) || type.isNone(organizationFields.slug)) {
      throw new Error(
        'CreateOrganization requires "name" and "slug" when run without a userId (creator-less provisioning).'
      );
    }
    const orgPlugin = auth.options.plugins.find((plugin) => plugin.id === 'organization');
    const orgAdapter = getOrgAdapter(authContext, orgPlugin.options);
    // createOrganization spreads the row verbatim and adds no timestamp.
    return orgAdapter.createOrganization({
      organization: {
        ...organizationFields,
        createdAt: new Date(),
      },
    });
  }

  const endpoint = getPluginEndpoint({
    authContext,
    endpointKey: 'createOrganization',
    pluginId: 'organization',
  });
  return invokeEndpoint({
    endpoint,
    input: {
      body: { ...properties, userId },
      context: { ...authContext },
    },
  });
}

// system scope: under the pinned policy organizations are seeded by
// ensureOrganization, under tenant they are minted lazily at session create, and
// allowUserToCreateOrganization: false already says no user creates one. There
// is no organization to hold authority in before this step runs.
CreateOrganization.meta = { authority: { scope: 'system' } };

export default CreateOrganization;
