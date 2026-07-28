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

import getOrganizationBinding from '../routes/auth/organizations/getOrganizationBinding.js';
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
// unauthenticated: a stale cookie from another app's deployment and a member
// removed mid-session are treated as logged out, not logged-in with no roles.
//
// A session carrying no active organization at all is the one case that
// differs by policy. Under pinned it resolves to unauthenticated on the same
// reasoning. Under tenant it resolves to a caller carrying identity, no
// membership and no roles, marked awaitingOrganization - the invited user
// before they accept. Authorization refuses that caller wherever auth.public
// is false (createAuthorize), so the marker widens no access; it exists so the
// public accept page can tell an invited user from a stranger.
//
// member.role stores multiple roles as a comma-separated string - split back
// into the array Lowdefy authorization expects. context.user.attributes is
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
    // Under tenant a session legitimately carries no organization: the invited
    // user, before they accept. Resolving them to null makes the accept page
    // unable to tell them from a stranger, and the page it needs is the one
    // page they can reach. They become a caller carrying identity and no
    // membership, marked awaitingOrganization - createAuthorize refuses that
    // caller wherever auth.public is false, so no protected page opens up.
    // Under pinned the state has no meaning: one organization exists, and
    // someone outside it has no reason to be known to the app.
    if (getOrganizationBinding({ auth })?.policy !== 'tenant') {
      context.user = null;
      return;
    }
    context.user = {
      ...session.user,
      roles: [],
      // The per-organization half of the bag needs a member row, so an
      // awaiting caller carries the global attributes alone.
      attributes: session.user.attributes ?? {},
      awaitingOrganization: true,
    };
  } else {
    const { adapter } = await auth.$context;
    const member = await adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: session.user.id },
        { field: 'organizationId', value: activeOrganizationId },
      ],
    });
    if (type.isNone(member)) {
      context.user = null;
      return;
    }
    const roles = (member.role ?? '')
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
    context.user = {
      ...session.user,
      roles,
      attributes: {
        ...(session.user.attributes ?? {}),
        ...(member.attributes ?? {}),
      },
      activeOrganizationId,
    };
  }
  // impersonatedBy is a BetterAuth admin plugin session field - present only
  // while an admin is impersonating this session. Steps read it off the
  // settled _user surface, so it is omitted (not set to undefined) when absent.
  if (!type.isNone(session.session.impersonatedBy)) {
    context.user.impersonatedBy = session.session.impersonatedBy;
  }
}

export default resolveAuthentication;
