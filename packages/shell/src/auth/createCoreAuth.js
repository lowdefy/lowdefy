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

import { getAuthorizationHeaders } from '@lowdefy/client-core';
import { type } from '@lowdefy/helpers';

/**
 * The auth client the core's auth actions call (client-core createAuthMethods), as the web's is
 * its Better Auth client: each method calls a Better Auth route with the session token as a bearer
 * token and resolves with Better Auth's `{ data, error }`. Calls go through the watched fetch, so
 * a 401 ends the session on the phone as any other call's does.
 *
 * The session the shell holds (the caller, its roles and organisation, and the pages it may open)
 * is the app session's last sync. A switch of organisation syncs it before the action resolves, so
 * the switch takes effect at once; UpdateSession syncs it too.
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {Function} params.fetch The watched fetch (watchSession).
 * @param {Function} params.getSession The app session (createAppSession), once started.
 * @param {{ get }} params.tokenStore The session token store.
 */
function createCoreAuth({ apiBase, fetch, getSession, tokenStore }) {
  async function call({ body = {}, method = 'POST', path }) {
    const headers = getAuthorizationHeaders({ host: { authTransport: 'bearer', tokenStore } });
    const init = { method, headers };
    if (method !== 'GET') {
      init.headers = { ...headers, 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    }
    const res = await fetch(`${apiBase}/api/auth${path}`, init);
    // A route an app's org policy disables answers 404 with no JSON body.
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const details = type.isObject(data) ? data : {};
      return { data: null, error: { ...details, status: res.status, statusText: res.statusText } };
    }
    return { data, error: null };
  }

  async function sync() {
    await getSession().sync();
  }

  function listOrganizations() {
    return call({ method: 'GET', path: '/organization/list' });
  }

  async function setActiveOrganization({ organizationId, organizationSlug }) {
    const result = await call({
      path: '/organization/set-active',
      body: { organizationId, organizationSlug },
    });
    if (result.error === null) {
      await sync();
    }
    return result;
  }

  function refreshSession() {
    return call({ method: 'GET', path: '/get-session' });
  }

  async function getResolvedUser() {
    await sync();
    return { user: getSession().getState().user };
  }

  function signOut() {
    return call({ path: '/sign-out' });
  }

  return {
    authConfig: {},
    getResolvedUser,
    listOrganizations,
    refreshSession,
    setActiveOrganization,
    signOut,
  };
}

export default createCoreAuth;
