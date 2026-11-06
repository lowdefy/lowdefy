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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// The engine-tier binding on the organization plugin's beforeAcceptInvitation
// hook, which keeps the login's contactId a link that is set once. Apps compare
// _user.contact_id in author and access checks, so the link is an
// authorization input: accepting an invitation may set it on a login that has
// none, and never changes one that is set. An invitation naming a different
// contact is refused here, before BetterAuth moves the invitation off pending
// or writes the member row, so a refusal leaves nothing half-written - the
// invitation stays pending and no membership exists. A wrong link is corrected
// in the data, then the invitation can be accepted.
//
// The hook's user is the session user, which may be a cookie-cached copy, so
// the link is read from the stored user row.
function createBeforeAcceptInvitationHook({ getAuth }) {
  return async function beforeAcceptInvitationHook({ invitation, user }) {
    if (!type.isString(invitation.contactId)) {
      return;
    }
    const { adapter } = await getAuth().$context;
    const userRow = await adapter.findOne({
      model: 'user',
      where: [{ field: 'id', value: user.id }],
    });
    const linkedContactId = userRow.contactId;
    if (type.isNone(linkedContactId) || linkedContactId === invitation.contactId) {
      return;
    }
    throw new APIError('BAD_REQUEST', {
      code: 'CONTACT_LINK_MISMATCH',
      message: `Login "${user.id}" is linked to contact "${linkedContactId}", but the invitation names contact "${invitation.contactId}". Correct the login's contact link in the data before the invitation can be accepted.`,
    });
  };
}

export default createBeforeAcceptInvitationHook;
