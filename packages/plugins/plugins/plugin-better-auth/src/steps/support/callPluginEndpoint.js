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

import createActingMemberAdapter from './createActingMemberAdapter.js';
import getPluginEndpoint from './getPluginEndpoint.js';
import invokeEndpoint from './invokeEndpoint.js';

// Admin steps carry server authority: the hosting Lowdefy endpoint's auth.api.roles
// gate is the only authorization, so BetterAuth's own caller access control is
// satisfied mechanically by injecting an acting session with role "admin" (admin
// plugin) and a virtual owner member row (org plugin). Nothing here is written to
// the database - the acting identity exists only for the duration of the call.
async function callPluginEndpoint({ acting, auth, body, endpointKey, pluginId, query }) {
  const authContext = await auth.$context;
  const endpoint = getPluginEndpoint({ authContext, endpointKey, pluginId });

  let actingUser;
  if (type.isNone(acting.user)) {
    actingUser = {
      id: 'lowdefy:system',
      email: 'system@lowdefy.internal',
      name: 'Lowdefy System',
      emailVerified: true,
      image: null,
      role: 'admin',
    };
  } else {
    actingUser = {
      id: acting.user.id,
      email: acting.user.email,
      name: acting.user.name,
      image: acting.user.image,
      emailVerified: acting.user.emailVerified,
      role: 'admin',
    };
  }

  const actingSession = {
    session: {
      id: 'lowdefy:system-session',
      token: 'lowdefy:system-session',
      userId: actingUser.id,
      activeOrganizationId: acting.user?.activeOrganizationId ?? null,
      expiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: actingUser,
  };

  const context = {
    ...authContext,
    adapter: createActingMemberAdapter({ actingUser, adapter: authContext.adapter }),
    // The admin plugin re-fetches the session from headers when a server-side
    // session store exists (options.database or secondaryStorage). Forcing both
    // undefined on the per-call options makes it honor the injected session.
    options: { ...authContext.options, database: undefined, secondaryStorage: undefined },
    session: actingSession,
  };

  if (!type.isUndefined(query)) {
    return invokeEndpoint({ endpoint, input: { query, headers: new Headers(), context } });
  }
  return invokeEndpoint({ endpoint, input: { body, headers: new Headers(), context } });
}

export default callPluginEndpoint;
