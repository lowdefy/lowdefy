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

async function InviteMember({ acting, auth, organization, properties }) {
  // contactId and attributes are registered invitation additionalFields in
  // the engine config; accepting the invitation stamps contactId onto the
  // user and copies attributes onto the minted member row.
  const { attributes, contactId, email, resend, role } = properties;
  if (type.isNone(email)) {
    throw new Error('InviteMember requires an "email" property.');
  }
  if (type.isNone(role)) {
    throw new Error('InviteMember requires a "role" property.');
  }
  if (!type.isNone(attributes) && !type.isObject(attributes)) {
    throw new Error(
      `InviteMember "attributes" is not an object. Received ${JSON.stringify(attributes)}.`
    );
  }
  const organizationId = resolveOrganizationId({
    organization,
    organizationId: properties.organizationId,
    step: 'InviteMember',
  });
  return callPluginEndpoint({
    acting,
    auth,
    body: { attributes, contactId, email, organizationId, resend, role },
    endpointKey: 'createInvitation',
    pluginId: 'organization',
  });
}

export default InviteMember;
