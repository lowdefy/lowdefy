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

import { APIError, getSessionFromCtx } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

const NO_LONGER_ACCEPTABLE_STATUSES = ['canceled', 'rejected'];

function isNoLongerAcceptable(invitation) {
  if (NO_LONGER_ACCEPTABLE_STATUSES.includes(invitation.status)) {
    return true;
  }
  // Strictly before now, the same boundary as the accept route's own check.
  return invitation.status === 'pending' && new Date(invitation.expiresAt) < new Date();
}

// The engine-tier request hooks.before on /organization/accept-invitation.
// BetterAuth answers an expired, cancelled and unknown invitation alike -
// INVITATION_NOT_FOUND, "Invitation not found" - which an invitee opening an
// old link reads as a broken link. When the invitation exists but can no
// longer be accepted, this answers INVITATION_EXPIRED instead, telling them to
// ask for a new one. A cancelled (or rejected) invitation reads as expired: the
// invitee's next step is the same, and why the inviter withdrew it is not
// theirs to know. An unknown id and an accepted invitation fall through to
// BetterAuth's own answer. Expiry is checked before the recipient, as
// BetterAuth itself does, so holding the id - the invitee's credential - is the
// only way to learn it expired. This hook runs before the route's own session
// check, so it answers signed-in callers only: a signed-out caller gets the
// route's 401 whether the id exists or not, and learns nothing about it.
//
// A bare handler: the request-hook assembler matches the path and owns the
// createAuthMiddleware wrapper.
function createExpiredInvitationGate({ getAuth }) {
  return async function expiredInvitationGate(ctx) {
    const invitationId = ctx.body?.invitationId;
    // A missing id is the route's own validation error - let it answer.
    if (!type.isString(invitationId)) {
      return undefined;
    }
    // getSessionFromCtx memoizes on ctx.context, so the route's own session
    // check reads the same session without a second lookup.
    const session = await getSessionFromCtx(ctx);
    if (type.isNone(session?.user)) {
      return undefined;
    }
    const { adapter } = await getAuth().$context;
    const invitation = await adapter.findOne({
      model: 'invitation',
      where: [{ field: 'id', value: invitationId }],
    });
    if (type.isNone(invitation) || !isNoLongerAcceptable(invitation)) {
      return undefined;
    }
    throw new APIError('BAD_REQUEST', {
      code: 'INVITATION_EXPIRED',
      message: 'This invitation has expired. Ask the person who invited you to send a new one.',
    });
  };
}

export default createExpiredInvitationGate;
