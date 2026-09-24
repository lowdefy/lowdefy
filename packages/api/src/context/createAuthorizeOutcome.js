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
import { ConfigError } from '@lowdefy/errors';

// createAuthorizeOutcome is called with the context object on every path
// (createApiContext, applySystemTrust, and the runners), so `system` is read
// straight off context.system - the single run-level trust marker every
// authorization layer reads.
//
// It returns an OUTCOME, not a boolean: 'allow', 'deny', or 'enrol_required'.
// The rename is load-bearing. Every previous caller was a truthiness test, and
// every non-empty string is truthy, so a caller left on `authorize` would read
// 'deny' as authorized and stop enforcing auth entirely on that surface. There
// is deliberately NO boolean authorize left beside this - a missed call site
// must throw TypeError, which also catches callers outside this repo.
//
// The ordering is security-critical and written here exactly once. Enrolment is
// checked LAST, after roles: checking it first hands an unenrolled caller an
// enrol redirect for every protected page that EXISTS and /404 for those that do
// not, which is a working page-enumeration oracle over pages they have no access
// to. Checked last, they see the enrol outcome only for pages they would have
// been let into - which tells them exactly what an enrolled caller learns by
// getting the page.
function createAuthorizeOutcome({ authEnforcement, system, user }) {
  const authenticated = !type.isNone(user);
  // A caller awaiting an organization is signed in and holds no membership -
  // under tenant, the invited user before they accept (resolveAuthentication).
  // They are known so the always-public accept page can address them, and
  // refused everywhere auth.public is false, roles or not: empty roles is not a
  // wall (user-model Decision 2), so authenticated alone must not admit them to
  // a role-less protected page. Strategy callers (apiKey, jwt) also hold no
  // organization but sit deliberately outside the membership boundary, so the
  // test is this explicit marker, never the absence of an organization. The
  // caller is the normalizeCaller-snaked record, so the key is snake_case here.
  const awaitingOrganization = user?.awaiting_organization === true;
  const roles = user?.roles ?? [];
  if (!Array.isArray(roles) || roles.some((role) => !type.isString(role))) {
    throw new ConfigError('user.roles must be an array of strings.', {
      received: roles,
    });
  }
  const enrolmentRequired = authEnforcement?.twoFactorRequired === true;
  const enrolPageId = authEnforcement?.twoFactorEnrolPageId ?? null;

  // pageId is passed only by the page route. Requests, endpoints, websockets and
  // menu items pass none, so the enrolment-page exemption cannot be reached by a
  // request id that happens to collide with the enrol page's id.
  function authorizeOutcome(config, { pageId } = {}) {
    // A system context has no session and no caller, so "does this caller's
    // session carry the required roles?" is undefined, not denied - and it holds
    // no factor either, so the enrolment floor is undefined for it too.
    if (system === true) return 'allow';
    const { auth } = config;
    if (auth.public === true) return 'allow';
    if (auth.public === false) {
      if (!authenticated) return 'deny';
      if (awaitingOrganization) return 'deny';
      if (auth.roles && !auth.roles.some((role) => roles.includes(role))) return 'deny';
      // Enrolment last, after roles. Strictly === false: the key is present only
      // on a caller resolved from a session, so API strategy callers and the
      // dev/e2e injected callers pass untouched by inheritance rather than by a
      // carve-out (Decision 10). `!user.two_factor_enrolled` would redirect every
      // one of them.
      if (enrolmentRequired && user.two_factor_enrolled === false) {
        // The enrolment page itself is exempt from the enrolment check alone -
        // it is a protected page and stays one; this is not a public-ness
        // exemption (Decision 8).
        if (!type.isNone(pageId) && pageId === enrolPageId) return 'allow';
        return 'enrol_required';
      }
      return 'allow';
    }
    throw new ConfigError('auth.public must be true or false.', {
      received: auth.public,
      configKey: config['~k'],
    });
  }
  return authorizeOutcome;
}

export default createAuthorizeOutcome;
