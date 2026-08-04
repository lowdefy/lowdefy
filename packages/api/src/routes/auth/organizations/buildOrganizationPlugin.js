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
// every app. The build collects the app's role catalog (auth.roles, a list of
// { id, label, description }); each role.id registers in the plugin's access
// control with empty permission statements - enough for the member APIs to
// accept it for storage and assignment, but authorizing nothing at the AC
// statement layer. Real statements per role are the permissions milestone's.
//
// One reserved authority role, id "$lowdefy-system" (the "$" namespace is
// un-authorable, so no real user can hold it), carries the statements the
// audited admin steps need - they drive member mutations by invoking the org
// endpoint handlers directly, which still run hasPermission against the acting
// member row (fabricated in createActingMemberAdapter, claiming this role).
//
// The wiring is policy-aware:
//   - pinned: pass only catalogRoles + the reserved role (no defaultRoles), and
//     set creatorRole to "$lowdefy-system". With defaultRoles dropped, owner/
//     admin/member no longer resolve as real plugin roles, so they become inert
//     app-feature strings with no hidden org-admin power; the acting member is
//     the creator, so it passes the plugin's creator-protection guards.
//   - tenant: keep the built-in owner/admin/member tier active (self-serve
//     per-org administration), so pass defaultRoles and leave creatorRole at its
//     default ("owner"). The reserved role is still registered but is not
//     load-bearing here - the audited steps belong to the pinned admin module.
function buildOrganizationPlugin({ authConfig, getAuth, sendInvitationEmail }) {
  const ac = createAccessControl(defaultStatements);
  const catalogRoles = {};
  (authConfig.roles ?? []).forEach((role) => {
    catalogRoles[role.id] = ac.newRole({});
  });
  catalogRoles['$lowdefy-system'] = ac.newRole({
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    organization: ['update', 'delete'],
  });

  const policy = authConfig.organizations?.policy ?? 'pinned';
  const roles = policy === 'tenant' ? { ...catalogRoles, ...defaultRoles } : { ...catalogRoles };

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
      afterAcceptInvitation: createAfterAcceptInvitationHook({
        getAuth,
        userAdminRole: authConfig.userAdminRole ?? null,
      }),
    },
    sendInvitationEmail,
  };

  // Under pinned the reserved role is the creator, so the plugin's creator
  // short-circuit and creator-protection guards key on it rather than "owner".
  // Under tenant creatorRole stays at its "owner" default (last-owner
  // protection keys on it), so it is left unset.
  if (policy !== 'tenant') {
    options.creatorRole = '$lowdefy-system';
  }

  return organization(options);
}

export default buildOrganizationPlugin;
