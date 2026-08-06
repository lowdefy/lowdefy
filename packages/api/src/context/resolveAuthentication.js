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

import { normalizeCaller, type } from '@lowdefy/helpers';

import { getRegisteredOrganization } from '../routes/auth/organizations/getOrganizationBinding.js';
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
// roles. Under policy: pinned, a session whose active organization is not this
// app's organization is treated the same way, member row there or not.
//
// The resolved caller is a record, so its keys are snake_case like every other
// column an app reads - normalizeCaller applies that once over the whole
// assembled object. The transform is not the adapter's: BetterAuth hands back
// camelCase JS keys (emailVerified, twoFactorEnabled) whatever the columns are
// named, so without it session.user would reintroduce camelCase beside the
// Lowdefy-resolved keys on the same object.
//
// The member row carries two unrelated authorities and they stay apart.
// context.user.roles is member.appRoles - the app's own role strings, and the
// only source createAuthorizeOutcome matches against auth.roles page and endpoint
// gates. context.user.org_roles is the split of member.role - BetterAuth's
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
//
// context.user.two_factor_enrolled is the one caller fact no session field
// carries: whether this person holds a factor that satisfies
// auth.twoFactor.required. It is set only on session callers - strategy,
// injected and system callers omit the key entirely, so the enrolment gate,
// which tests === false, lets every non-session caller through untouched.
// The passkey plugin is configured iff it is registered on the instance -
// getBetterAuthConfig only pushes it when auth.passkey.enabled is true.
function passkeyConfigured({ auth }) {
  return (auth.options?.plugins ?? []).some((plugin) => plugin?.id === 'passkey');
}

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
  // Under pinned, the active organization must be this app's organization.
  // Without this, a session pinned elsewhere - accept-time drift from an
  // invitation another app sent, a stale cookie, a session shared between two
  // pinned apps on one host - resolves as an authenticated caller here
  // carrying the other organization's roles, so every role name the two
  // catalogs share becomes a page they can open. Ahead of the member read: a
  // foreign session costs no database round trip.
  //
  // The comparison target is the configured slug, not getOrganizationBinding's
  // pinned.id, because pinned can legitimately be absent on a live request -
  // resolvePinnedOrganization swallows a failed ensure so the _organization
  // operator and step organizationId defaulting fail with their own clear
  // errors instead of every request failing in the middleware. Comparing
  // against an unresolved binding would either log the whole deployment out on
  // a transient database error or skip the check exactly when the database is
  // unhealthy. Under pinned the organization's id is its slug, so the check
  // needs no database read and an unhealthy ensure cannot defeat it.
  //
  // Recovery is one re-login at this app: applyPinnedPolicy runs at every
  // session.create and re-pins the session whenever the caller holds a member
  // row here. Never send the person to the other app - the production cookie
  // prefix is shared across apps on one host, so signing in there flips the
  // shared session the other way and breaks the app they came from.
  //
  // Under tenant there is no pinned organization and the check does not apply.
  const registered = getRegisteredOrganization({ auth });
  if (registered?.policy === 'pinned' && activeOrganizationId !== registered.slug) {
    context.logger.debug(
      `Session for user "${session.user.id}" has active organization "${activeOrganizationId}", which is not this app's pinned organization "${registered.slug}" - resolved unauthenticated.`
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
  // twoFactorEnrolled - holds a factor that satisfies auth.twoFactor.required
  // (Decision 4). Short-circuits on twoFactorEnabled, which rides session.user
  // (the plugin declares input: false but not returned: false), so only an
  // UNENROLLED caller costs the passkey read - and once required is on, that is
  // the shrinking minority by design.
  //
  // The passkey read is gated on the plugin being CONFIGURED, not on
  // required === true: gating on required would make this field mean "has
  // enrolled" in one deployment and "has enrolled TOTP" in another, a value that
  // lies depending on config. A passkey counts because it is a phishing-resistant
  // possession factor with user verification bound to it - the reason Entra and
  // Okta accept one outright. (It is not the ONLY route a passwordless user has:
  // Lowdefy sets allowPasswordless: true, so TOTP is reachable by them too -
  // Decision 4. The passkey still counts here on its own merit.)
  //
  // Needs the platform-owned user-passkeys { userId: 1 } index - without it this
  // is a collection scan on every request from an unenrolled caller.
  let twoFactorEnrolled = session.user.twoFactorEnabled === true;
  if (!twoFactorEnrolled && passkeyConfigured({ auth })) {
    const passkeyCount = await adapter.count({
      model: 'passkey',
      where: [{ field: 'userId', value: session.user.id }],
    });
    twoFactorEnrolled = passkeyCount > 0;
  }
  // normalizeCaller is shallow, so the attributes bag it carries through is the
  // merge below verbatim - app-owned keys inside it are never renamed.
  context.user = normalizeCaller({
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
    twoFactorEnrolled,
    // organization_id is the caller's active org in its serialized string form -
    // the value the tenant wall stamps onto and filters walled collections with,
    // and the one operators read as _user: organization_id. It resolves under
    // both organizations policies (under pinned it always equals the pinned
    // org, since set-active-organization is disabled there).
    organizationId: activeOrganizationId,
  });
}

export default resolveAuthentication;
