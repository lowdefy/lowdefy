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

import createAfterAcceptInvitationHook from './createAfterAcceptInvitationHook.js';
import modelNames from '../modelNames.js';
import { ac, roles } from './organizationAccessControl.js';

// Organizations are always on - the membership and boundary mechanism for every
// app. member.role carries BetterAuth's org-authority tier and nothing else, so
// the same three built-in roles - owner, admin, member - are registered under
// both policies. The statement set they are rebuilt against is extended with the
// actions the step floor's permission map asks for; see
// organizationAccessControl.js.
//
// The app's authored role catalog (auth.roles) is NOT registered here. App roles
// live on member.appRoles, a separate field, so they never need to resolve as
// plugin roles. Registering only the three built-in names is what makes the
// separation enforced rather than merely observed: validStaticRoles in
// crud-members.mjs is built from Object.keys(roles), so update-member-role and
// invite-member refuse any other value for member.role even from a hand-crafted
// request body.
//
// The only policy difference left is who may call the endpoints, and that lives
// in getBetterAuthConfig as disabledPaths - the client-facing org routes are
// disabled under pinned and enabled under tenant.
//
// creatorRole is left at its "owner" default under both policies. The plugin's
// creator short-circuit is gated on allowCreatorsAllPermissions, so it was never
// the reason to override it; what an override defended were the
// creator-protection guards, which key on the member's role string. With app
// roles out of that field and the fabricated acting member claiming "owner"
// itself, there is nothing left to defend against.
function buildOrganizationPlugin({ getAuth, sendInvitationEmail }) {
  const options = {
    ac,
    roles,
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
        // app-facing additionalFields surface. appRoles carries the app's own
        // role strings; member.role is left to BetterAuth's owner/admin/member
        // org-authority tier, so the two authorities never share a field.
        // input: false says these are never accepted from a request body.
        additionalFields: {
          appRoles: { type: 'string[]', required: false, input: false },
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
        //
        // appRoles is declared without the input: false its member counterpart
        // carries. toZodSchema drops input: false fields when isClientSide is
        // set, and the plugin builds the /organization/invite-member body with
        // isClientSide: true - an input: false appRoles would be stripped from
        // that body, and no invitation could ever carry app roles. Under tenant
        // that endpoint is enabled, so an org admin or owner can invite an
        // address with arbitrary, unvalidated app roles. That is intended:
        // inviting members with app roles is what administering your own
        // organization means, and it stays inside the organization the caller
        // already administers.
        additionalFields: {
          appRoles: { type: 'string[]', required: false },
          attributes: { type: 'json', required: false },
          profile: { type: 'json', required: false },
        },
      },
    },
    organizationHooks: {
      afterAcceptInvitation: createAfterAcceptInvitationHook({ getAuth }),
    },
    sendInvitationEmail,
  };

  return organization(options);
}

export default buildOrganizationPlugin;
