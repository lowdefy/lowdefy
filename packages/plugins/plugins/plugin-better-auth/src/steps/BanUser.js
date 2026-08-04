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

// organizationId is part of the authored property surface even though the ban is
// written on the user row and the step forwards nothing else: the floor reads it
// to resolve the organization the caller's user:ban authority and the target's
// membership are checked in. It defaults to the pinned organization, so without
// it a second admin surface's Suspend control would ask whether the caller holds
// user: [ban] in the wrong organization.
async function BanUser({ acting, auth, properties }) {
  const { banExpiresIn, banReason, userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('BanUser requires a "userId" property.');
  }
  return callPluginEndpoint({
    acting,
    auth,
    body: { banExpiresIn, banReason, userId },
    endpointKey: 'banUser',
    pluginId: 'admin',
  });
}

// The ban is written on the user row, which is one row per person for the whole
// deployment - authorizing on the caller's org authority alone would let an
// administrator of any organization reach any user at all. targetUser names the
// property holding the target's id so the floor can require that person to hold
// a member row in the organization the caller administers: membership is the
// relationship that makes them the caller's business.
BanUser.meta = {
  authority: { scope: 'org', permissions: { user: ['ban'] }, targetUser: 'userId' },
};

export default BanUser;
