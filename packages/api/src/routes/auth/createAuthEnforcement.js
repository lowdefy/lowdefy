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

// authPages values are page paths ("/two-factor-enrol"); the gate compares
// against a page id ("two-factor-enrol", "account/two-factor-enrol"), so strip
// the leading slash once, here, rather than at every read.
function toPageId(pagePath) {
  if (!type.isString(pagePath)) return null;
  return pagePath.startsWith('/') ? pagePath.slice(1) : pagePath;
}

// The one mapping from the built auth.json to the enforcement facts the
// authorization layers read: the protection an unlisted page id inherits, the
// one page exempt from the enrolment floor, and the floor itself. The auth
// engine retains them per instance (registerAuthEnforcement); a caller with no
// engine that asks for them reads the same mapping (createInjectedApiContext).
function createAuthEnforcement({ authJson }) {
  return {
    pagesProtectedByDefault: authJson.pagesProtectedByDefault === true,
    twoFactorEnrolPageId: toPageId(authJson.authPages?.twoFactorEnrol),
    twoFactorRequired: authJson.twoFactor?.required === true,
  };
}

export default createAuthEnforcement;
