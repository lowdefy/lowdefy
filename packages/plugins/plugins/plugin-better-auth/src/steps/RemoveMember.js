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
import resolveOrganizationId from './support/resolveOrganizationId.js';
import syncUserAdminRole from './support/syncUserAdminRole.js';

async function RemoveMember({ acting, auth, organization, properties, userAdminRole }) {
  const { memberIdOrEmail } = properties;
  if (type.isNone(memberIdOrEmail)) {
    throw new Error('RemoveMember requires a "memberIdOrEmail" property.');
  }
  const organizationId = resolveOrganizationId({
    organization,
    organizationId: properties.organizationId,
    step: 'RemoveMember',
  });
  const result = await callPluginEndpoint({
    acting,
    auth,
    body: { memberIdOrEmail, organizationId },
    endpointKey: 'removeMember',
    pluginId: 'organization',
  });

  // Membership removal is followed in-band by the engine's user.role
  // denormalization - losing the pinned membership clears the role.
  await syncUserAdminRole({
    auth,
    organization,
    userAdminRole,
    userId: result?.member?.userId,
  });

  return result;
}

export default RemoveMember;
