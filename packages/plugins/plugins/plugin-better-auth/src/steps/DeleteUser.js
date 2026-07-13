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

// The design routes member and invitation cleanup "via the org plugin's APIs",
// but at better-auth 1.6.23 removeMember refuses once the user row is gone (it
// re-reads the user and 400s). The cascade therefore uses the adapter layer -
// the same layer the engine already uses for org seeding and tenant minting.
// The admin removeUser endpoint hard-deletes the user row and (confirmed by the
// phase-0 probe at 1.6.23) also clears the user's session and account rows, so
// those are not cleared here. App-owned data is left untouched.
async function DeleteUser({ acting, auth, properties }) {
  const { userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('DeleteUser requires a "userId" property.');
  }
  const { adapter } = await auth.$context;

  const user = await adapter.findOne({
    model: 'user',
    where: [{ field: 'id', value: userId }],
  });
  if (type.isNone(user)) {
    throw new Error(`DeleteUser found no user with id "${userId}".`);
  }

  await callPluginEndpoint({
    acting,
    auth,
    body: { userId },
    endpointKey: 'removeUser',
    pluginId: 'admin',
  });

  const members = await adapter.findMany({
    model: 'member',
    where: [{ field: 'userId', value: userId }],
  });
  for (const member of members ?? []) {
    await adapter.delete({
      model: 'member',
      where: [{ field: 'id', value: member.id }],
    });
  }

  const invitations = await adapter.findMany({
    model: 'invitation',
    where: [
      { field: 'email', value: user.email },
      { field: 'status', value: 'pending' },
    ],
  });
  for (const invitation of invitations ?? []) {
    await adapter.delete({
      model: 'invitation',
      where: [{ field: 'id', value: invitation.id }],
    });
  }

  // Returns the removed rows so routines can write audit events.
  return { success: true, user, members: members ?? [], invitations: invitations ?? [] };
}

export default DeleteUser;
