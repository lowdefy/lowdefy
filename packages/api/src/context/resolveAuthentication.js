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

import { decodeJwt, jwtVerify } from 'jose';
import { normalizeCaller, type } from '@lowdefy/helpers';

import { getRegisteredOrganization } from '../routes/auth/organizations/getOrganizationBinding.js';
import { getAsIssuer, getMcpResourceUri, getMcpUriPrefix } from '../routes/mcp/getMcpUri.js';
import getMcpJwks from '../routes/mcp/getMcpJwks.js';
import resolveStrategyCaller from './resolveStrategyCaller.js';

// resolveAuthentication is the single writer of context.user - nothing
// downstream rewrites it. The session and strategy branches are disjoint
// ways to become a caller: a resolved session is terminal - it never falls
// through to strategies, so a walled-out member cannot be silently
// re-admitted by an apiKey/jwt strategy carrying config-granted roles. API
// strategies are tried, in config order, only when no session resolves.
//
// The third branch is the MCP bearer branch, gated on the resource option
// only the /api/mcp/:org route passes - see resolveMcpCaller below. It is
// disjoint the same way: an MCP request never resolves a session or a
// strategy caller, and the general path refuses any bearer whose audience is
// an MCP resource URI before the strategies run.
//
// The active member row is the hard membership wall and the role source in
// one indexed read ({ userId, organizationId } on the member model), live on
// every request so membership removal and role changes take effect
// immediately - roles are deliberately not stamped onto the session. A
// session whose user holds no member row in the active org resolves to
// unauthenticated: a stale cookie from another app's deployment and a member
// removed mid-session are treated as logged out, not logged-in with no roles.
// Under policy: pinned, a session whose active organization is not this app's
// organization is treated the same way, member row there or not.
//
// A session carrying no active organization at all differs by policy. Under
// pinned it resolves to unauthenticated on the same reasoning. Under tenant it
// resolves to a caller carrying identity, no membership and no roles, marked
// awaitingOrganization - the invited user before they accept.
// createAuthorizeOutcome refuses that caller wherever auth.public is false, so
// the marker widens no access; it exists so the always-public accept page can
// tell an invited user from a stranger.
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
// user.contactId - the link to the app's canonical record for this person -
// rides the same spread on the same argument, and is absent the same way for a
// user with no link (never synthesized to null). The platform projects it and
// stops there: nothing here reads it, and nothing resolves what it points at.
// It needs no special casing handling: normalizeCaller's all-keys rule snakes
// it to _user.contact_id like every other field, and the adapter's schema-wide
// derive stores it as the contact_id column.
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

// The membership wall and the caller assembly, shared verbatim by the session
// and MCP bearer branches so the two ways to become a member caller cannot
// drift - one member read, one role source, one caller shape.
async function resolveMemberCaller(context, { adapter, auth, organizationId, user }) {
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: user.id },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (type.isNone(member)) {
    context.logger.debug(
      `User "${user.id}" has no member row in organization "${organizationId}" - resolved unauthenticated.`
    );
    return null;
  }
  // member.role is a CSV BetterAuth writes over a closed three-name set the
  // platform itself writes, so no comma can appear inside a name.
  const orgRoles = (member.role ?? '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
  // twoFactorEnrolled - holds a factor that satisfies auth.twoFactor.required
  // (Decision 4). Short-circuits on twoFactorEnabled, which rides the user
  // record both branches hand in (session.user projects it - the plugin
  // declares input: false but not returned: false), so only an UNENROLLED
  // caller costs the passkey read - and once required is on, that is the
  // shrinking minority by design.
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
  let twoFactorEnrolled = user.twoFactorEnabled === true;
  if (!twoFactorEnrolled && passkeyConfigured({ auth })) {
    const passkeyCount = await adapter.count({
      model: 'passkey',
      where: [{ field: 'userId', value: user.id }],
    });
    twoFactorEnrolled = passkeyCount > 0;
  }
  // normalizeCaller is shallow, so the attributes bag it carries through is the
  // merge below verbatim - app-owned keys inside it are never renamed.
  return normalizeCaller({
    ...user,
    // Per-organization display copies, denormalized onto the member row by
    // UpdateUserProfile. The user row's name/image are deployment-global and
    // last-edit-wins across workspaces, so a caller acting in organization A
    // would otherwise be stamped and rendered with the identity last saved in
    // organization B (T18). Nullish-coalesced: a member who has never saved a
    // profile in this organization falls back to the global copies.
    name: member.name ?? user.name,
    image: member.image ?? user.image,
    // Absent on a member row minted with no app roles - never falls back to
    // member.role, which would make the two fields one dual-storage scheme.
    roles: member.appRoles ?? [],
    orgRoles,
    attributes: {
      ...(user.attributes ?? {}),
      ...(member.attributes ?? {}),
    },
    activeOrganizationId: organizationId,
    twoFactorEnrolled,
    // organization_id is the caller's active org in its serialized string form -
    // the value the tenant wall stamps onto and filters walled collections with,
    // and the one operators read as _user: organization_id. It resolves under
    // both organizations policies (under pinned it always equals the pinned
    // org, since set-active-organization is disabled there).
    organizationId,
  });
}

// The HTTP call sites hand over Fetch Headers; direct callers pass plain
// objects - read both so neither shape silently reads as "no bearer".
function readBearerToken({ headers }) {
  const authorization =
    typeof headers?.get === 'function' ? headers.get('authorization') : headers?.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length).trim();
}

// The closed MCP scope vocabulary - the AS grants nothing outside it, and
// grantedScopes never carries a foreign scope string downstream.
const MCP_SCOPES = ['mcp:read', 'mcp:write'];

// An access token minted for an MCP resource must never re-enter the general
// /api/* surface as a strategy caller - even a jwt strategy misconfigured to
// point at the app's own JWKS would otherwise accept it with the strategy's
// config-granted roles. Tested on the decoded aud alone, unverified:
// rejection needs no key material, and a forged aud only denies its forger.
// A non-JWT bearer or a decode failure is not this check's concern - opaque
// strategy credentials fall through to the strategies unchanged.
function hasMcpAudienceBearer({ context, headers }) {
  const token = readBearerToken({ headers });
  if (token === null) {
    return false;
  }
  const uriPrefix = getMcpUriPrefix({ config: context.config });
  if (uriPrefix === null) {
    return false;
  }
  let aud;
  try {
    ({ aud } = decodeJwt(token));
  } catch (error) {
    return false;
  }
  const audiences = type.isArray(aud) ? aud : [aud];
  const rejected = audiences.some((value) => type.isString(value) && value.startsWith(uriPrefix));
  if (rejected) {
    context.logger.debug(
      { event: 'auth_mcp_audience_bearer_rejected' },
      'Bearer token carrying an MCP resource audience rejected on the general API surface - resolved unauthenticated.'
    );
  }
  return rejected;
}

// The MCP bearer branch. The org comes from the URL (under pinned that is the
// slug), and this route accepts exactly one credential kind: an access token
// this app's authorization server minted for this org's resource URI - a
// session cookie or a strategy credential never authenticates here. The token
// is verified in-process with jose against the AS's own signing keys; the
// audience check is what binds the token to this org, so no org claim is
// needed. context.mcpAuth records the token outcome for the route layer's
// challenge decisions; context.user stays the only caller surface.
async function resolveMcpCaller(context, { auth, headers, resource }) {
  const orgId = resource.orgId;
  const token = readBearerToken({ headers });
  if (token === null) {
    // The anonymous caller - public tools only, never a challenge here.
    context.user = null;
    context.mcpAuth = { orgId, tokenStatus: 'none', parseableJwt: true };
    return;
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getMcpJwks({ auth }), {
      issuer: getAsIssuer({ config: context.config }),
      // jose matches an array aud containing the value, so RFC 8707
      // multi-resource grants verify against this org's canonical URI.
      audience: getMcpResourceUri({ config: context.config, orgId }),
      // A token without a subject cannot source a caller - rejected as
      // invalid rather than half-resolved.
      requiredClaims: ['sub'],
    }));
  } catch (error) {
    let parseableJwt = true;
    try {
      decodeJwt(token);
    } catch (decodeError) {
      parseableJwt = false;
    }
    context.logger.debug(
      { event: 'auth_mcp_token_rejected', err: error, orgId },
      `MCP bearer token rejected for organization "${orgId}": ${error.message}`
    );
    context.user = null;
    context.mcpAuth = { orgId, tokenStatus: 'invalid', parseableJwt };
    return;
  }
  // The scope claim reduced to the closed MCP vocabulary. Recorded before the
  // member wall on purpose: a caller with a valid token but no live member row
  // degrades to the anonymous caller, not to an invalid-token challenge.
  const grantedScopes = (type.isString(payload.scope) ? payload.scope : '')
    .split(' ')
    .filter((scope) => MCP_SCOPES.includes(scope));
  context.mcpAuth = { orgId, tokenStatus: 'valid', parseableJwt: true, grantedScopes };
  // The same pinned wall the session branch applies: a pinned app serves one
  // organization, so a token for any other resource URI - verifiable or not -
  // never reaches the member read.
  const registered = getRegisteredOrganization({ auth });
  if (registered?.policy === 'pinned' && orgId !== registered.slug) {
    context.logger.debug(
      `MCP request for organization "${orgId}", which is not this app's pinned organization "${registered.slug}" - resolved unauthenticated.`
    );
    context.user = null;
    return;
  }
  const { adapter } = await auth.$context;
  // The bearer carries only sub - the caller's user fields are read live, so a
  // deleted user degrades to the anonymous caller exactly like a revoked member.
  const user = await adapter.findOne({
    model: 'user',
    where: [{ field: 'id', value: payload.sub }],
  });
  if (type.isNone(user)) {
    context.logger.debug(
      `MCP token subject "${payload.sub}" has no user row - resolved unauthenticated.`
    );
    context.user = null;
    return;
  }
  context.user = await resolveMemberCaller(context, {
    adapter,
    auth,
    organizationId: orgId,
    user,
  });
}

async function resolveAuthentication(context, { auth, headers, strategies, resource }) {
  if (type.isNone(auth)) {
    context.user = null;
    return;
  }
  // Only the /api/mcp/:org route passes resource - its callers authenticate
  // by access token alone, so the session and strategy branches are skipped
  // outright rather than tried and out-prioritized.
  if (!type.isNone(resource)) {
    await resolveMcpCaller(context, { auth, headers, resource });
    return;
  }
  const session = await auth.api.getSession({ headers });
  if (type.isNone(session)) {
    if (hasMcpAudienceBearer({ context, headers })) {
      context.user = null;
      return;
    }
    context.user = await resolveStrategyCaller({
      headers,
      logger: context.logger,
      strategies,
    });
    return;
  }
  const activeOrganizationId = session.session.activeOrganizationId;
  if (type.isNone(activeOrganizationId)) {
    // A session with no active organization differs by policy. Under tenant it
    // is the invited user before they accept - their pre-accept session carries
    // no organization by design, because they are about to join someone else's.
    // Resolving them to null leaves the always-public accept page unable to
    // tell them from a stranger, and that page is the one page they can reach.
    // They become a caller carrying identity, no membership and no roles,
    // marked awaitingOrganization - createAuthorizeOutcome refuses that caller
    // wherever auth.public is false, so the marker widens no access. Under
    // pinned the state has no meaning: one organization exists, and someone
    // outside it has no reason to be known to the app.
    if (getRegisteredOrganization({ auth })?.policy !== 'tenant') {
      context.logger.debug(
        `Session for user "${session.user.id}" has no active organization - resolved unauthenticated.`
      );
      context.user = null;
      return;
    }
    context.logger.debug(
      `Session for user "${session.user.id}" has no active organization under tenant - resolved awaiting organization.`
    );
    // No member row, so no per-organization attributes and no roles of either
    // kind - the global attributes ride alone.
    context.user = normalizeCaller({
      ...session.user,
      roles: [],
      orgRoles: [],
      attributes: session.user.attributes ?? {},
      awaitingOrganization: true,
    });
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
  context.user = await resolveMemberCaller(context, {
    adapter,
    auth,
    organizationId: activeOrganizationId,
    user: session.user,
  });
}

export default resolveAuthentication;
