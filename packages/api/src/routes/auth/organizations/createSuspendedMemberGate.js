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

import isActiveMember from './isActiveMember.js';

// More rows than any one person holds, so the read is one round trip.
const MEMBER_ROWS_LIMIT = 1000;

// The organization plugin's client endpoints that act as a member of an
// organization. Each one checks membership with its own adapter read, which
// knows nothing of member.suspended, so a person suspended in an organization
// would otherwise still read its members, switch to it, invite into it or
// leave it from the browser. Endpoints that need no membership are not listed:
// create (disabled by allowUserToCreateOrganization), check-slug, and the
// invitee's own get-invitation, list-user-invitations, reject-invitation and
// accept-invitation (accepting leaves an existing membership as it is, see
// createAcceptExistingMemberHook). /organization/list is filtered instead, by
// createSuspendedOrganizationsFilter.
const MEMBER_GATED_PATHS = [
  '/organization/set-active',
  '/organization/update',
  '/organization/delete',
  '/organization/leave',
  '/organization/update-member-role',
  '/organization/remove-member',
  '/organization/invite-member',
  '/organization/cancel-invitation',
  '/organization/list-members',
  '/organization/get-active-member',
  '/organization/get-active-member-role',
  '/organization/get-full-organization',
  '/organization/get-organization',
  '/organization/list-invitations',
  '/organization/has-permission',
];

// Every organization the request could act in. The endpoints differ in which
// of these they read first (get-organization prefers the slug, set-active the
// id), so all of them are gathered and the request is refused if the caller is
// suspended in any. The active organization is the endpoints' fallback, so it
// counts only when the request names none - a person whose active
// organization is one they are suspended in can still switch away from it.
async function readTargetOrganizationIds({ adapter, ctx, session }) {
  const ids = [ctx.body?.organizationId, ctx.query?.organizationId].filter(type.isString);
  const slugs = [ctx.body?.organizationSlug, ctx.query?.organizationSlug].filter(type.isString);
  for (const slug of slugs) {
    const organization = await adapter.findOne({
      model: 'organization',
      where: [{ field: 'slug', value: slug }],
    });
    if (!type.isNone(organization)) {
      ids.push(organization.id);
    }
  }
  // cancel-invitation names only the invitation; the endpoint checks the
  // caller's membership in the invitation's organization.
  if (type.isString(ctx.body?.invitationId)) {
    const invitation = await adapter.findOne({
      model: 'invitation',
      where: [{ field: 'id', value: ctx.body.invitationId }],
    });
    if (!type.isNone(invitation)) {
      ids.push(invitation.organizationId);
    }
  }
  if (ids.length === 0 && type.isString(session.session.activeOrganizationId)) {
    ids.push(session.session.activeOrganizationId);
  }
  return ids;
}

// The engine-tier request hooks.before that refuses a member-gated
// organization endpoint when the caller is suspended in the organization it
// acts in, with the error the endpoint gives a non-member. Registered under
// tenant only: under pinned every listed path is disabled.
function createSuspendedMemberGate() {
  return async function suspendedMemberGate(ctx) {
    // Clearing the active organization needs no membership.
    if (ctx.path === '/organization/set-active' && ctx.body?.organizationId === null) {
      return undefined;
    }
    const session = await getSessionFromCtx(ctx);
    // No session is the endpoint's own 401.
    if (type.isNone(session)) {
      return undefined;
    }
    const { adapter } = ctx.context;
    const organizationIds = await readTargetOrganizationIds({ adapter, ctx, session });
    if (organizationIds.length === 0) {
      return undefined;
    }
    const members = await adapter.findMany({
      model: 'member',
      where: [{ field: 'userId', value: session.user.id }],
      limit: MEMBER_ROWS_LIMIT,
    });
    const suspended = members.some(
      (member) => organizationIds.includes(member.organizationId) && !isActiveMember({ member })
    );
    if (!suspended) {
      return undefined;
    }
    throw new APIError('FORBIDDEN', {
      message: 'User is not a member of the organization',
      code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION',
    });
  };
}

export { MEMBER_GATED_PATHS };
export default createSuspendedMemberGate;
