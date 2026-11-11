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

// The API context for a caller that was injected rather than resolved: a dev
// mock user, the dev headless renderer's cookie user, the e2e server's cookie
// user, a test harness user. No auth engine runs for such a caller, so
// createApiContext finds no retained organization binding and leaves
// context.organization null, which would silently switch the tenant wall off
// (resolveTenancy reads context.organization.policy). The policy comes from
// the built auth config instead, so the wall engages under policy: tenant and
// an injected caller there must carry an organization id or fail closed.
// pinned stays null: with no engine there is no seeded organization row.
//
// authJson is the built auth.json. An app that declares no organizations keeps
// the null binding createApiContext set.
function createInjectedApiContext(context, { authJson }) {
  createApiContext(context);
  if (!type.isNone(authJson.organizations)) {
    context.organization = { policy: authJson.organizations.policy, pinned: null };
  }
}

export default createInjectedApiContext;
