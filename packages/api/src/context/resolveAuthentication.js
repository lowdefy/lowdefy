/* eslint-disable no-param-reassign */

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

import resolveStrategyCaller from './resolveStrategyCaller.js';

// resolveAuthentication is the single writer of context.user - nothing
// downstream rewrites it. The session and strategy branches are disjoint
// ways to become a caller: a resolved session is terminal - it never falls
// through to strategies, so a walled-out member cannot be silently
// re-admitted by an apiKey/jwt strategy carrying config-granted roles. API
// strategies are tried, in config order, only when no session resolves.
//
// The active member row is the hard membership wall and the role source in
// one indexed read ({ userId, organizationId } on the member model), live on
// every request so membership removal and role changes take effect
// immediately - roles are deliberately not stamped onto the session. A
// session whose user holds no member row in the active org resolves to
// unauthenticated: an invitee's pre-accept session (the session.create
// carve-out), a stale cookie from another app's deployment, and a member
// removed mid-session are all treated as logged out, not logged-in with no
// roles.
//
// The member row carries two unrelated authorities and they stay apart.
// context.user.roles is member.appRoles - the app's own role strings, and the
// only source createAuthorize matches against auth.roles page and endpoint
// gates. context.user.orgRoles is the split of member.role - BetterAuth's
// owner/admin/member tier, an administrative fact about this organization that
// no gate reads. context.user.attributes is
// the one merged bag of authorization inputs: user.attributes (global) and
// the active member's attributes (per-org), shallow per-key merge where the
// member value wins - nested objects replace, never deep-merge.
//
// user.profile - the opaque display-and-app-data bag - rides the
// session.user spread onto the resolved caller (denormalization, not a join:
// no extra lookup). A user with no profile writes carries no profile key, so
// _user.profile is undefined - never a synthesized {}. Strategy callers lack
// profile exactly as they lack name and image.
async function resolveAuthentication(context, { auth, headers, strategies }) {
  if (type.isNone(auth)) {
    context.user = null;
    return;
  }
  const session = await auth.api.getSession({ headers });
  if (type.isNone(session)) {
    context.user = await resolveStrategyCaller({
      headers,
      logger: context.logger,
      strategies,
    });
    return;
  }
  const activeOrganizationId = session.session.activeOrganizationId;
  if (type.isNone(activeOrganizationId)) {
    context.logger.debug(
      `Session for user "${session.user.id}" has no active organization - resolved unauthenticated.`
    );
    context.user = null;
    return;
  }
  const { adapter } = await auth.$context;
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: session.user.id },
      { field: 'organizationId', value: activeOrganizationId },
    ],
  });
  if (type.isNone(member)) {
    context.logger.debug(
      `User "${session.user.id}" has no member row in organization "${activeOrganizationId}" - resolved unauthenticated.`
    );
    context.user = null;
    return;
  }
  // member.role is a CSV BetterAuth writes over a closed three-name set the
  // platform itself writes, so no comma can appear inside a name.
  const orgRoles = (member.role ?? '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
  context.user = {
    ...session.user,
    // Absent on a member row minted with no app roles - never falls back to
    // member.role, which would make the two fields one dual-storage scheme.
    roles: member.appRoles ?? [],
    orgRoles,
    attributes: {
      ...(session.user.attributes ?? {}),
      ...(member.attributes ?? {}),
    },
    activeOrganizationId,
  };
}

export default resolveAuthentication;
