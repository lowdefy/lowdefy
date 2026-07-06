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
import splitRoles from './support/splitRoles.js';
import syncUserAdminRole from './support/syncUserAdminRole.js';

async function UpdateMemberRoles({ acting, auth, organization, properties, userAdminRole }) {
  const { memberId, role } = properties;
  if (type.isNone(memberId)) {
    throw new Error('UpdateMemberRoles requires a "memberId" property.');
  }
  if (type.isNone(role)) {
    throw new Error('UpdateMemberRoles requires a "role" property.');
  }
  const organizationId = resolveOrganizationId({
    organization,
    organizationId: properties.organizationId,
    step: 'UpdateMemberRoles',
  });

  // At better-auth 1.6.23, updateMemberRole's "cannot leave the organization
  // without an owner" check only fires when the updater edits their own row.
  // The step acts with a virtual owner session, so demoting the LAST real owner
  // would slip through - guard here, mirroring BetterAuth's
  // YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER semantics.
  const { adapter } = await auth.$context;
  // Scoped to the resolved organization so a memberId from another org falls
  // through to the endpoint's member-not-found error instead of this guard.
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'id', value: memberId },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (!type.isNone(member)) {
    const currentRoles = splitRoles(member.role);
    const newRoles = splitRoles(role);
    if (currentRoles.includes('owner') && !newRoles.includes('owner')) {
      const members = await adapter.findMany({
        model: 'member',
        where: [{ field: 'organizationId', value: organizationId }],
      });
      const ownerCount = (members ?? []).filter((row) =>
        splitRoles(row.role).includes('owner')
      ).length;
      if (ownerCount <= 1) {
        throw new Error('You cannot leave the organization without an owner.');
      }
    }
  }

  const updatedMember = await callPluginEndpoint({
    acting,
    auth,
    body: { memberId, organizationId, role },
    endpointKey: 'updateMemberRole',
    pluginId: 'organization',
  });

  // Member-role writes are followed in-band by the engine's user.role
  // denormalization - a sync failure fails the step.
  await syncUserAdminRole({
    auth,
    organization,
    userAdminRole,
    userId: updatedMember?.userId ?? member?.userId,
  });

  return updatedMember;
}

export default UpdateMemberRoles;
