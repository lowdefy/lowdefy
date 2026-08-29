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

// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function InviteMember({ acting, auth, organizationId, properties }) {
  // appRoles, attributes, contactId and profile are registered invitation
  // additionalFields in the engine config; accepting the invitation
  // shallow-merges profile onto the user's profile bag (invitation wins per
  // key), sets contactId on the user row, and copies attributes and appRoles
  // onto the minted member row. Each is declared without input: false
  // precisely so this body may carry it.
  const { appRoles, attributes, contactId, email, orgRole, profile, resend } = properties;
  if (type.isNone(email)) {
    throw new Error('InviteMember requires an "email" property.');
  }
  // Array-only, to keep the two authorities distinct wherever an author names
  // roles. Absent is fine - an invitation carrying no app roles is legitimate
  // and common.
  if (!type.isNone(appRoles) && !type.isArray(appRoles)) {
    throw new Error('InviteMember "appRoles" is not an array.');
  }
  if (!type.isNone(orgRole) && !type.isString(orgRole)) {
    throw new Error('InviteMember "orgRole" is not a string.');
  }
  if (!type.isNone(attributes) && !type.isObject(attributes)) {
    throw new Error('InviteMember "attributes" is not an object.');
  }
  if (!type.isNone(profile) && !type.isObject(profile)) {
    throw new Error('InviteMember "profile" is not an object.');
  }
  if (!type.isNone(contactId) && !type.isString(contactId)) {
    throw new Error('InviteMember "contactId" is not a string.');
  }
  // An omitted orgRole must still send something: createInvitation's body
  // schema declares role as required, so undefined fails the zod body, and ''
  // passes it silently - BetterAuth filters the empty entry out before
  // validating, stores role: '', and acceptInvitation mints the member row
  // from that value verbatim. 'member' is the no-authority value, and this is
  // the product's most common invitation: app roles, no org authority.
  return callPluginEndpoint({
    acting,
    auth,
    body: {
      appRoles,
      attributes,
      contactId,
      email,
      organizationId,
      profile,
      resend,
      role: orgRole ?? 'member',
    },
    endpointKey: 'createInvitation',
    pluginId: 'organization',
  });
}

// Minting an invitation into an organization needs invitation:create authority
// in that organization.
InviteMember.meta = {
  authority: { scope: 'org', permissions: { invitation: ['create'] } },
};

export default InviteMember;
