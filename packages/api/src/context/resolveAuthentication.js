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

// resolveAuthentication is the single writer of context.user - nothing
// downstream rewrites it. Phase 1 provides the session path; API strategies
// (no-session callers) and role resolution from membership follow in later
// phases. Interim contract: a real session resolves with roles = [].
async function resolveAuthentication(context, { auth, headers }) {
  if (type.isNone(auth)) {
    context.user = null;
    return;
  }
  const session = await auth.api.getSession({ headers });
  if (type.isNone(session)) {
    context.user = null;
    return;
  }
  context.user = { ...session.user, roles: [] };
}

export default resolveAuthentication;
