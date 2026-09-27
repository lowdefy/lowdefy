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

import { getSessionFromCtx } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// The engine-tier request hooks.before on /organization/accept-invitation for a
// caller who is already a member of the invitation's organization - someone
// invited before they joined another way (the open-signup auto-join, an
// operator's AddMember). BetterAuth's accept route writes a second member row
// for them, which the unique (user, organization) index refuses, and the route
// then reverts the invitation and fails. Accepting is answered here instead:
// the invitation is marked accepted and the membership is left exactly as it
// is - no second row, and nothing from the invitation (role, app roles,
// attributes, profile) is applied. BetterAuth treats an invitation as the way
// to join, never as a role change: it refuses to invite an existing member,
// and role changes go through update-member-role, which checks the caller's
// authority at the time of the change. An invitation written before the
// membership existed must not override what an administrator set since.
//
// Only the case the route can not serve is answered. Anything the route would
// refuse first - a missing session, an unknown, expired, used or someone
// else's invitation, an unverified email - falls through so the route gives
// its own error. The email check mirrors the route's: Lowdefy sets a
// function-form generateId, which makes the organization plugin require a
// verified email to accept by invitation id.
//
// Like the route, the session gets the organization as its active one only
// when it has none (createAcceptActiveOrgGuardHook vetoes the route's switch
// away from an existing active organization).
function createAcceptExistingMemberHook() {
  return async function acceptExistingMemberHook(ctx) {
    const invitationId = ctx.body?.invitationId;
    if (!type.isString(invitationId)) {
      return undefined;
    }
    const session = await getSessionFromCtx(ctx);
    if (type.isNone(session?.user) || session.user.emailVerified !== true) {
      return undefined;
    }
    const { adapter, internalAdapter } = ctx.context;
    const invitation = await adapter.findOne({
      model: 'invitation',
      where: [{ field: 'id', value: invitationId }],
    });
    if (
      type.isNone(invitation) ||
      invitation.status !== 'pending' ||
      invitation.expiresAt < new Date() ||
      invitation.email.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      return undefined;
    }
    const member = await adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: session.user.id },
        { field: 'organizationId', value: invitation.organizationId },
      ],
    });
    if (type.isNone(member)) {
      return undefined;
    }
    // The route's own compare-and-set: of two concurrent accepts only one
    // moves the invitation off pending, and the other falls through to the
    // route, which answers it as the used invitation it now is.
    const accepted = await adapter.incrementOne({
      model: 'invitation',
      where: [
        { field: 'id', value: invitationId },
        { field: 'status', value: 'pending' },
      ],
      increment: {},
      set: { status: 'accepted' },
    });
    if (type.isNone(accepted)) {
      return undefined;
    }
    if (type.isNone(session.session.activeOrganizationId)) {
      await internalAdapter.updateSession(session.session.token, {
        activeOrganizationId: invitation.organizationId,
      });
    }
    return { invitation: accepted, member };
  };
}

export default createAcceptExistingMemberHook;
