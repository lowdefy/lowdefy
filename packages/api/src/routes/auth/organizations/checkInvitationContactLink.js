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

// The one check of an invitation's contactId against the accepting login's
// link, shared by both ways an accept is answered: the route's
// beforeAcceptInvitation hook and the existing-member request hook. The link
// is an authorization input apps compare in author and access checks, so it
// is set once: an invitation naming a different contact than the login holds
// is refused, naming the login and both contacts, before anything is written.
// The link is read from the stored user row, since the session user may be a
// cookie-cached copy. Returns true when the accept should set the link - the
// invitation names a contact and the login has none.
async function checkInvitationContactLink({ adapter, invitation, userId }) {
  if (!type.isString(invitation.contactId)) {
    return false;
  }
  const userRow = await adapter.findOne({
    model: 'user',
    where: [{ field: 'id', value: userId }],
  });
  if (type.isNone(userRow.contactId)) {
    return true;
  }
  if (userRow.contactId === invitation.contactId) {
    return false;
  }
  throw new APIError('BAD_REQUEST', {
    code: 'CONTACT_LINK_MISMATCH',
    message: `Login "${userId}" is linked to contact "${userRow.contactId}", but the invitation names contact "${invitation.contactId}". Correct the login's contact link in the data before the invitation can be accepted.`,
  });
}

export default checkInvitationContactLink;
