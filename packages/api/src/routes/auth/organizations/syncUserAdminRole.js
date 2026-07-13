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

import getOrganizationBinding from './getOrganizationBinding.js';

function splitRoles(role) {
  return String(role ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

// The engine maintains user.role as an internal denormalization: BetterAuth's
// admin plugin resolves impersonation permissions from the user-level role
// field and never reads member.role. When the user's member roles in the
// pinned organization include the configured auth.userAdminRole, the engine
// writes that role name to user.role; when they lose it, the engine clears
// the value it wrote (a foreign value is left alone). Apps never read or
// write it; it exists so BetterAuth's own check passes. Pinned policy only -
// tenant semantics wait for a multi-tenant admin design. The write is
// adapter-direct so no user.update database hooks fire for the internal
// bookkeeping. The twin helper for the admin steps lives in
// @lowdefy/plugin-better-auth (steps/support/syncUserAdminRole.js).
async function syncUserAdminRole({ auth, userAdminRole, userId }) {
  if (type.isNone(userAdminRole) || type.isNone(userId)) {
    return;
  }
  const organization = getOrganizationBinding({ auth });
  if (organization?.policy !== 'pinned') {
    return;
  }
  if (type.isNone(organization.pinned?.id)) {
    throw new Error(
      'Could not sync the user-admin role - the pinned organization is not resolved.'
    );
  }
  const { adapter } = await auth.$context;
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'organizationId', value: organization.pinned.id },
    ],
  });
  const holdsRole = !type.isNone(member) && splitRoles(member.role).includes(userAdminRole);
  const user = await adapter.findOne({
    model: 'user',
    where: [{ field: 'id', value: userId }],
  });
  // No user row means nothing to denormalize (the user was deleted between
  // the member write and this sync) - not a failure.
  if (type.isNone(user)) {
    return;
  }
  if (holdsRole && user.role !== userAdminRole) {
    await adapter.update({
      model: 'user',
      where: [{ field: 'id', value: userId }],
      update: { role: userAdminRole },
    });
  }
  if (!holdsRole && user.role === userAdminRole) {
    await adapter.update({
      model: 'user',
      where: [{ field: 'id', value: userId }],
      update: { role: null },
    });
  }
}

export default syncUserAdminRole;
