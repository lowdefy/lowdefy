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

import createApiContext from './createApiContext.js';
import createAuthEnforcement from '../routes/auth/createAuthEnforcement.js';
import createAuthorizeOutcome from './createAuthorizeOutcome.js';

// The API context for a caller that was injected rather than resolved: a dev
// mock user, the dev headless renderer's cookie user, the e2e server's cookie
// user, a test harness user. No auth engine runs for such a caller, so
// createApiContext finds nothing retained per auth instance and leaves both
// context.authEnforcement and context.organization null. Left that way the
// injected caller would meet a looser gate than production's, so both come
// from the built auth config instead.
//
// The enforcement facts (the enrolment floor, its exempt page, the
// unlisted-page default) use the mapping the auth engine retains them with.
// The gate closes over the facts it was built with, so it is built again.
// With them a signed-out injected caller is told to authenticate where a
// production one is, and one carrying two_factor_enrolled: false is asked to
// enrol under twoFactor.required; a caller without that key passes, as an API
// strategy caller does.
//
// The organization policy keeps the tenant wall engaged
// (resolveTenancy reads context.organization.policy): under policy: tenant an
// injected caller must carry an organization id or fail closed. pinned stays
// null: with no engine there is no seeded organization row.
//
// authJson is the built auth.json. An app with no auth configured keeps the
// null facts and the null binding createApiContext set, as in production,
// where no auth engine is built for it.
function createInjectedApiContext(context, { authJson }) {
  createApiContext(context);
  if (authJson.configured === true) {
    context.authEnforcement = createAuthEnforcement({ authJson });
    context.authorizeOutcome = createAuthorizeOutcome(context);
  }
  if (!type.isNone(authJson.organizations)) {
    context.organization = { policy: authJson.organizations.policy, pinned: null };
  }
}

export default createInjectedApiContext;
