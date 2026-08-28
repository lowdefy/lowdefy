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

// Ask the vendor's check where the vendor's check answers the right question.
//
// The organization plugin's does: on every mutation it resolves the CALLER's member
// row in the organization the body names and authorizes against that row's role -
// which is exactly the per-organization question a two-surface app asks, and an
// answer no app-wide role string can give. So a user-initiated org call carries the
// real caller: their identity, their own role, and the real adapter, so that check
// runs for real.
//
// The admin plugin's does not and cannot: it reads user.role, one field per
// deployment, so no value there can mean "may administer the customer
// organization". Handing it a real caller would make it answer a different question,
// not a better one. Admin calls therefore carry fabricated user-level authority and
// the step's own authority floor is their authorization.
//
// A caller-less run (acting.system) acts with server authority throughout: the
// lowdefy:system user plus createActingMemberAdapter, because auto-join, seeding and
// tenant minting all run before anyone is a member and there is no real member row
// to find. Nothing here is written to the database - the acting identity exists only
// for the duration of the call.
async function callPluginEndpoint({ acting, auth, body, endpointKey, pluginId, query }) {
  const authContext = await auth.$context;
  const endpoint = getPluginEndpoint({ authContext, endpointKey, pluginId });

  let actingUser;
  let activeOrganizationId;
  if (acting.system === true) {
    actingUser = {
      id: 'lowdefy:system',
      email: 'system@lowdefy.internal',
      name: 'Lowdefy System',
      emailVerified: true,
      image: null,
      role: 'admin',
    };
    activeOrganizationId = null;
  } else {
    // This is the inbound boundary back into BetterAuth, which names its own
    // fields in camelCase - so the keys stay camelCase while their values come
    // off the resolved caller, which carries snake_case like any other record.
    actingUser = {
      id: acting.user.id,
      email: acting.user.email,
      name: acting.user.name,
      image: acting.user.image,
      emailVerified: acting.user.email_verified,
      // The org plugin never reads this field, so the caller's own value rides along
      // untouched - undefined when they hold no tier. The admin plugin reads it as
      // the whole answer, so those calls get server authority instead.
      role: pluginId === 'organization' ? acting.user.role : 'admin',
    };
    // Steps always name the target organization in the body; this only feeds the org
    // plugin's fallback, so a session pinned to one org can still write into another.
    activeOrganizationId = acting.user.active_organization_id ?? null;
  }

  const actingSession = {
    session: {
      id: 'lowdefy:system-session',
      // Synthetic under both branches - context.user carries no session token. The org
      // plugin's self-removal paths are the only readers: removeMember (the one a step
      // can reach) calls adapter.setActiveOrganization(token, null) when a caller
      // removes their own membership from their active organization, and with a
      // synthetic token that update matches no session row - so the caller's active
      // organization keeps naming the organization they just left.
      token: 'lowdefy:system-session',
      userId: actingUser.id,
      activeOrganizationId,
      expiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: actingUser,
  };

  const context = {
    ...authContext,
    // Only a caller-less run needs a member row fabricated for it. A real caller must
    // reach the real adapter, or the org plugin authorizes a row that does not exist.
    adapter:
      acting.system === true
        ? createActingMemberAdapter({ actingUser, adapter: authContext.adapter })
        : authContext.adapter,
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
