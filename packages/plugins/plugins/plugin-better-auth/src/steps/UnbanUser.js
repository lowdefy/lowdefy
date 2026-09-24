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

import callPluginEndpoint from './support/callPluginEndpoint.js';

// organizationId is part of the authored property surface even though the step
// forwards only the userId: the floor reads it to resolve the organization the
// caller's user:ban authority and the target's membership are checked in. It
// defaults to the pinned organization, so without it a second admin surface's
// Restore control would ask whether the caller holds user: [ban] in the wrong
// organization.
async function UnbanUser({ acting, auth, properties }) {
  const { userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('UnbanUser requires a "userId" property.');
  }
  return callPluginEndpoint({
    acting,
    auth,
    body: { userId },
    endpointKey: 'unbanUser',
    pluginId: 'admin',
  });
}

// Lifting the ban writes the same deployment-wide user row BanUser sets, so it
// carries the same bound: org authority alone would reach every user in the
// deployment, and targetUser makes the floor require the target to hold a member
// row in the organization the caller administers.
UnbanUser.meta = {
  authority: { scope: 'org', permissions: { user: ['ban'] }, targetUser: 'userId' },
};

export default UnbanUser;
