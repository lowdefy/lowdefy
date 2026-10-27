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

function holdsOwnerTier({ member }) {
  return (member.role ?? '')
    .split(',')
    .map((role) => role.trim())
    .includes('owner');
}

// Suspending takes a person out of one organization without banning their
// login, which BanUser does for every organization in the deployment, and
// without deleting their member row, which RemoveMember does. The row keeps its
// roles, attributes and display copies, so the app's own queries still find the
// person - a report of everyone who held a role - while every membership check
// treats them as a non-member: they resolve unauthenticated, cannot sign in to a
// pinned app, and their MCP tokens stop working.
//
// Adapter-direct, like UpdateMemberRoles: the flag is an admin-set
// authorization input, not an org-tier change, so it fires no member.update
// database hooks.
//
// An owner is never suspended - their org tier is changed first, with
// UpdateMemberOrgRole. The organization plugin's owner guards (an admin cannot
// remove or demote an owner, the last owner cannot leave, be removed or demote
// themselves) count every owner row and know nothing of suspension, so a
// suspended owner would let an admin lock an owner out and let the last
// active owner leave behind only suspended ones. Keeping suspended rows out of
// the owner tier keeps those guards exact; beforeUpdateMemberRole refuses the
// other way in, promoting a suspended member.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function SuspendMember({ acting, auth, organizationId, properties }) {
  const { memberId } = properties;
  if (type.isNone(memberId)) {
    throw new Error('SuspendMember requires a "memberId" property.');
  }
  const { adapter } = await auth.$context;
  const where = [
    { field: 'id', value: memberId },
    { field: 'organizationId', value: organizationId },
  ];
  const member = await adapter.findOne({ model: 'member', where });
  if (type.isNone(member)) {
    throw new Error(
      `SuspendMember found no member "${memberId}" in organization "${organizationId}".`
    );
  }
  if (holdsOwnerTier({ member })) {
    throw new Error(
      `SuspendMember cannot suspend member "${memberId}" - they are an owner of organization "${organizationId}". Change their org role with UpdateMemberOrgRole first.`
    );
  }
  // A caller who suspends themselves resolves unauthenticated from the next
  // request on, with no way back short of another administrator.
  if (acting.system !== true && member.userId === acting.user.id) {
    throw new Error(
      `SuspendMember cannot suspend member "${memberId}" - it is the caller's own membership.`
    );
  }
  // Written only while the role is still the one read, so a promotion to owner
  // that lands between the read and this write is not suspended with it. The
  // row can also be removed in between.
  const suspended = await adapter.update({
    model: 'member',
    where: [...where, { field: 'role', value: member.role }],
    update: { suspended: true },
  });
  if (type.isNone(suspended)) {
    throw new Error(
      `SuspendMember found no member "${memberId}" in organization "${organizationId}" with role "${member.role}". It was removed or its org role changed - try again.`
    );
  }
  return suspended;
}

// Suspending takes a member out of the organization the caller administers, so
// it needs member:suspend authority there - its own action, so a narrower role
// can manage members without it.
SuspendMember.meta = {
  authority: { scope: 'org', permissions: { member: ['suspend'] } },
};

export default SuspendMember;
