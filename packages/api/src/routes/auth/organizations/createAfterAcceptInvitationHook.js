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
// invitation.contactId - the link to the app's record for this person - rides
// the same user-row update as the profile merge, and is set only on a login
// that has no link yet: the link is an authorization input, set once.
// createBeforeAcceptInvitationHook has already refused an invitation naming a
// different contact than the login's, before the member row was written.
// Invite-time member attributes and app roles ride the invitation the same
// way: accepting copies invitation.attributes and invitation.appRoles onto the
// minted member row (one adapter-layer update, parallel to the opaque profile
// merge), so an invited user's authorization parameters and app roles hold
// from their first session instead of an empty bag until an admin edits the
// member. The guard fires when either field is present - folding appRoles into
// an attributes-only guard would silently drop the roles of every invitation
// that carries roles and no attributes.
//
// invitation.role needs no copy: acceptInvitation mints the member row from it
// directly (crud-invites.mjs:324), never validating it against the registered
// set - which is what makes the bootstrap recipe's hand-inserted role: 'owner'
// work.
function createAfterAcceptInvitationHook({ getAuth }) {
  return async function afterAcceptInvitationHook({ invitation, member, user }) {
    const { adapter, internalAdapter } = await getAuth().$context;
    const userUpdate = {};
    const copiesProfile = type.isObject(invitation.profile);
    const copiesContactId = type.isString(invitation.contactId);
    if (copiesProfile || copiesContactId) {
      // The hook's user is the session user, which may be a cookie-cached
      // copy - the merge base and the current link are read from the user row
      // so a read-merge-write never resurrects a stale profile, and a link
      // set since the session was cached is never overwritten.
      const userRow = await adapter.findOne({
        model: 'user',
        where: [{ field: 'id', value: user.id }],
      });
      if (copiesProfile) {
        userUpdate.profile = { ...(userRow.profile ?? {}), ...invitation.profile };
      }
      // An invitation that names no link leaves an existing one standing, and
      // the same link is not written again.
      if (copiesContactId && type.isNone(userRow.contactId)) {
        userUpdate.contactId = invitation.contactId;
      }
    }
    if (Object.keys(userUpdate).length > 0) {
      await internalAdapter.updateUser(user.id, userUpdate);
    }
    const memberUpdate = {};
    if (type.isObject(invitation.attributes)) {
      memberUpdate.attributes = invitation.attributes;
    }
    // An empty appRoles array is a copied value, not an absent field - an
    // invitation that deliberately grants nothing writes [].
    if (type.isArray(invitation.appRoles)) {
      memberUpdate.appRoles = invitation.appRoles;
    }
    if (Object.keys(memberUpdate).length > 0) {
      await adapter.update({
        model: 'member',
        where: [{ field: 'id', value: member.id }],
        update: memberUpdate,
      });
    }
  };
}

export default createAfterAcceptInvitationHook;
