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
// database hooks. The one org-tier invariant it can break is guarded here - the
// organization's last unsuspended owner is never suspended, or nobody would be
// left to administer it.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function SuspendMember({ auth, organizationId, properties }) {
  const { memberId } = properties;
  if (type.isNone(memberId)) {
    throw new Error('SuspendMember requires a "memberId" property.');
  }
  const { adapter } = await auth.$context;
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'id', value: memberId },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (type.isNone(member)) {
    throw new Error(
      `SuspendMember found no member "${memberId}" in organization "${organizationId}".`
    );
  }
  if (holdsOwnerTier({ member }) && member.suspended !== true) {
    const owners = await adapter.findMany({
      model: 'member',
      where: [
        { field: 'organizationId', value: organizationId },
        { field: 'role', operator: 'contains', value: 'owner' },
      ],
    });
    const otherActiveOwners = owners.filter(
      (owner) =>
        owner.id !== member.id && owner.suspended !== true && holdsOwnerTier({ member: owner })
    );
    if (otherActiveOwners.length === 0) {
      throw new Error(
        `SuspendMember cannot suspend member "${memberId}" - they are the last unsuspended owner of organization "${organizationId}".`
      );
    }
  }
  return adapter.update({
    model: 'member',
    where: [
      { field: 'id', value: memberId },
      { field: 'organizationId', value: organizationId },
    ],
    update: { suspended: true },
  });
}

// Suspending takes a member out of the organization the caller administers, so
// it needs member:suspend authority there - its own action, so a narrower role
// can manage members without it.
SuspendMember.meta = {
  authority: { scope: 'org', permissions: { member: ['suspend'] } },
};

export default SuspendMember;
