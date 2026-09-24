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

// Adapter-direct rather than through the organization plugin's member rails.
// What the rails buy is invariant enforcement - last-owner protection, seat
// counts, future Teams - and consistent member state for other plugins, and
// every one of those invariants concerns the org tier (who may administer this
// organization) or membership existence. An appRoles write touches neither: it
// only changes what the member may do inside the app. Fires NO member.update
// database hooks, for the same reason UpdateMemberAttributes fires none - app
// roles are the same category of admin-set authorization input as attributes,
// not a user-driven edit. The org tier lives on member.role and is written by
// UpdateMemberOrgRole, never here.
//
// Submitted role names are deliberately not checked against any catalog. An
// unrecognised entry grants nothing, so rejecting it would prevent no harmful
// outcome while blocking display-only roles and failing an admin's whole save
// because of a stale role they never touched. Orphaned role names stay
// first-class, and removable.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function UpdateMemberRoles({ auth, organizationId, properties }) {
  const { appRoles, memberId } = properties;
  if (type.isNone(memberId)) {
    throw new Error('UpdateMemberRoles requires a "memberId" property.');
  }
  // Array-only. Accepting a comma-separated string would preserve the exact
  // ambiguity between the two authorities that this surface exists to remove,
  // in the one place an author reads about roles. An empty array is valid - it
  // clears the member's app roles.
  if (!type.isArray(appRoles)) {
    throw new Error('UpdateMemberRoles requires an "appRoles" array.');
  }
  const { adapter } = await auth.$context;
  const member = await adapter.update({
    model: 'member',
    where: [
      { field: 'id', value: memberId },
      { field: 'organizationId', value: organizationId },
    ],
    update: { appRoles },
  });
  if (type.isNone(member)) {
    // Mirrors the rails' member-not-found semantics - a memberId outside the
    // resolved organization must fail loudly, not skip the write silently.
    throw new Error(
      `UpdateMemberRoles found no member "${memberId}" in organization "${organizationId}".`
    );
  }
  return member;
}

// Rewriting a member row's roles needs member:update authority in the
// organization that row belongs to.
UpdateMemberRoles.meta = {
  authority: { scope: 'org', permissions: { member: ['update'] } },
};

export default UpdateMemberRoles;
