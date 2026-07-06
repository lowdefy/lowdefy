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

// The engine-tier binding on the organization plugin's afterAcceptInvitation
// hook (an organizationHooks callback, not a database hook - it fires after
// the member row is created). An invitation may carry an opaque profile bag;
// accepting shallow-merges it onto the accepting user's user.profile,
// invitation winning per key - an opaque copy the engine never reads inside.
// The merge is in-band: a failed copy fails the accept and the user retries.
// Invite-time member attributes ride the invitation the same way: accepting
// copies invitation.attributes onto the minted member row (an adapter-layer
// update, parallel to the opaque profile merge), so an invited user's
// authorization parameters hold from their first session instead of an empty
// bag until an admin edits the member.
function createAfterAcceptInvitationHook({ getAuth }) {
  return async function afterAcceptInvitationHook({ invitation, member, user }) {
    const { adapter, internalAdapter } = await getAuth().$context;
    if (type.isObject(invitation.profile)) {
      // The hook's user is the session user, which may be a cookie-cached
      // copy - the merge base is read from the user row so a read-merge-write
      // never resurrects a stale profile.
      const userRow = await adapter.findOne({
        model: 'user',
        where: [{ field: 'id', value: user.id }],
      });
      await internalAdapter.updateUser(user.id, {
        profile: { ...(userRow.profile ?? {}), ...invitation.profile },
      });
    }
    if (type.isObject(invitation.attributes)) {
      await adapter.update({
        model: 'member',
        where: [{ field: 'id', value: member.id }],
        update: { attributes: invitation.attributes },
      });
    }
  };
}

export default createAfterAcceptInvitationHook;
