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

// The build-time auth facts the request-time authorization layers read. The gate
// is built synchronously (createApiContext, applySystemTrust), so it cannot read
// a build artifact - the servers hand auth.json to getBetterAuth, which retains
// the three values it needs here, keyed on the auth instance exactly as the
// organizations binding is.
const enforcementByAuth = new WeakMap();

// authPages values are page paths ("/two-factor-enrol"); the gate compares
// against a page id ("two-factor-enrol", "account/two-factor-enrol"), so strip
// the leading slash once, here, rather than at every read.
function toPageId(pagePath) {
  if (!type.isString(pagePath)) return null;
  return pagePath.startsWith('/') ? pagePath.slice(1) : pagePath;
}

function registerAuthEnforcement({ auth, authJson }) {
  enforcementByAuth.set(auth, {
    pagesProtectedByDefault: authJson.pagesProtectedByDefault === true,
    twoFactorEnrolPageId: toPageId(authJson.authPages?.twoFactorEnrol),
    twoFactorRequired: authJson.twoFactor?.required === true,
  });
}

function getAuthEnforcement({ auth }) {
  if (type.isNone(auth)) return null;
  return enforcementByAuth.get(auth) ?? null;
}

export { registerAuthEnforcement };
export default getAuthEnforcement;
