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

// Writes member.role - BetterAuth's owner/admin/member org-authority tier - and
// nothing else. A separate step from UpdateMemberRoles because the two fields
// take deliberately different write paths: app roles go adapter-direct, the org
// tier goes through the plugin's updateMemberRole endpoint. One step setting
// both would be two non-atomic writes, so a failure part-way through would
// leave the member with one tier changed and the other not. Two steps are one
// write each, separately authorized and separately audited; a caller changing
// both runs both.
//
// Through the endpoint because that is where the creator-protection and
// last-owner guards live (crud-members.mjs:173-181, 296-305, 399-407) and
// nowhere else - re-implementing them here would be two copies of one rule, and
// the copy here would be the one that goes stale. Those guards only bite while
// some member actually holds creatorRole ('owner'), which is why the bootstrap
// recipe seeds owner rather than admin.
//
// 'member' is the revoked value, not ''. updateMemberRole refuses an empty role
// twice - once on ctx.body.role directly and again after the comma split
// filter(Boolean)s it away - so an ''-as-revoked model could promote a member to
// admin and then never demote them. Revocation is the direction that matters.
//
// No allowlist of role names here. validStaticRoles in the endpoint is the union
// of the default roles and the registered ones, which is exactly
// owner/admin/member, so the endpoint rejects anything else with its own
// message. Nothing denormalizes this onto the user row either - user.role
// answers a per-deployment question, not a per-organization one.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function UpdateMemberOrgRole({ acting, auth, organizationId, properties }) {
  const { memberId, orgRole } = properties;
  if (type.isNone(memberId)) {
    throw new Error('UpdateMemberOrgRole requires a "memberId" property.');
  }
  if (type.isNone(orgRole) || !type.isString(orgRole)) {
    throw new Error('UpdateMemberOrgRole requires an "orgRole" string property.');
  }
  return callPluginEndpoint({
    acting,
    auth,
    body: { memberId, organizationId, role: orgRole },
    endpointKey: 'updateMemberRole',
    pluginId: 'organization',
  });
}

// Changing a member's org tier needs member:update authority in the
// organization that row belongs to. The endpoint asks the same question again
// against the caller's real member row - the double-ask is intended, because
// that is the layer where the per-organization answer is authoritative.
UpdateMemberOrgRole.meta = {
  authority: { scope: 'org', permissions: { member: ['update'] } },
};

export default UpdateMemberOrgRole;
