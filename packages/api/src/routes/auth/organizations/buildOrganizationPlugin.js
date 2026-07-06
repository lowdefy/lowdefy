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

import { organization } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultRoles, defaultStatements } from 'better-auth/plugins/organization/access';

import createAfterAcceptInvitationHook from './createAfterAcceptInvitationHook.js';
import modelNames from '../modelNames.js';

// Organizations are always on - the membership and boundary mechanism for
// every app. The build collects the app's role catalog (auth.roles); each
// role registers in the plugin's access control with empty permission
// statements - enough for the member APIs to accept it for storage and
// assignment. Real statements per role are the permissions milestone's.
// Known limitation of empty statements: an actor holding only custom roles
// cannot call inviteMember as itself through the plugin's own AC check -
// admin member-mutations run through steps with server authority instead.
function buildOrganizationPlugin({ authConfig, getAuth, sendInvitationEmail }) {
  const ac = createAccessControl(defaultStatements);
  const catalogRoles = {};
  (authConfig.roles ?? []).forEach((roleName) => {
    catalogRoles[roleName] = ac.newRole({});
  });

  return organization({
    ac,
    // The built-in owner/admin/member roles keep their plugin statements
    // even when the app catalog reuses a built-in name - and the plugin's
    // permission check replaces rather than merges its defaults, so they
    // must be passed explicitly.
    roles: { ...catalogRoles, ...defaultRoles },
    // Organization creation is engine-only: the pinned org is seeded by
    // ensure-by-slug and tenant orgs are minted lazily at session.create -
    // both system actions that bypass this client-facing switch.
    allowUserToCreateOrganization: false,
    // Re-invite replaces: inviting an email with a pending invitation cancels
    // it and creates a fresh one with the new role, attributes, and profile
    // (old accept links die with the canceled row). resend: true instead
    // re-sends the existing invitation unchanged with a refreshed expiry.
    cancelPendingInvitationsOnReInvite: true,
    schema: {
      organization: { modelName: modelNames.organization },
      member: {
        modelName: modelNames.member,
        // Per-(user, org) admin-set authorization inputs - internal, not an
        // app-facing additionalFields surface.
        additionalFields: {
          attributes: { type: 'json', required: false, input: false },
        },
      },
      invitation: {
        modelName: modelNames.invitation,
        // An invitation may carry an opaque profile bag; accepting
        // shallow-merges it onto the accepting user's user.profile,
        // invitation winning per key. Invite-time member attributes ride the
        // invitation the same way - accepting copies them onto the minted
        // member row, so an invited user's authorization parameters hold
        // from their first session.
        additionalFields: {
          attributes: { type: 'json', required: false },
          profile: { type: 'json', required: false },
        },
      },
    },
    organizationHooks: {
      afterAcceptInvitation: createAfterAcceptInvitationHook({ getAuth }),
    },
    sendInvitationEmail,
  });
}

export default buildOrganizationPlugin;
