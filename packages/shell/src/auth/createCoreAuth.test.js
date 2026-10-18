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

import createAppSession from '../session/createAppSession.js';
import createCoreAuth from './createCoreAuth.js';
import createFakeServer, { header } from '../test/createFakeServer.js';
import createMemoryCacheStore from '../test/createMemoryCacheStore.js';
import createMemoryStore from '../host/createMemoryStore.js';
import { createPages, createRoot } from '../test/fixtures.js';

const apiBase = 'https://field.example.com';
const token = 'session-token.signature';

const organizations = [
  { id: 'org-1', name: 'Acme', slug: 'acme' },
  { id: 'org-2', name: 'Globex', slug: 'globex' },
];

// The app's server: Better Auth's organization routes over the bearer token, with the caller
// and user /api/user resolves moving to the organisation set-active makes active.
function authRoutes(server) {
  return function answer({ path, init }) {
    if (header(init, 'authorization') !== `Bearer ${token}`) {
      return { status: 401, body: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    }
    if (path === '/organization/list') {
      return { body: organizations };
    }
    if (path === '/organization/set-active') {
      const { organizationId } = JSON.parse(init.body);
      if (!organizations.some((org) => org.id === organizationId)) {
        return {
          status: 403,
          body: { code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION', message: 'Not a member.' },
        };
      }
      server.state.caller = `c-ana-${organizationId}; roles=r-${organizationId}`;
      server.state.user = { id: 'ana', organization_id: organizationId, roles: ['editor'] };
      return { body: organizations.find((org) => org.id === organizationId) };
    }
    if (path === '/get-session') {
      return { body: { session: { id: 's1' }, user: { id: 'ana' } } };
    }
    if (path === '/sign-out') {
      return { body: { success: true } };
    }
    return { status: 404, body: null };
  };
}

async function setup({ heldToken = token } = {}) {
  const server = createFakeServer({
    caller: 'c-ana-org-1; roles=r-org-1',
    user: { id: 'ana', organization_id: 'org-1', roles: ['viewer'] },
    root: createRoot(),
    rootEtag: '"root-1"',
    pages: createPages([['today', 'today', '"p-today-1"']]),
  });
  server.state.auth = authRoutes(server);
  const tokenStore = { get: () => heldToken };
  const session = createAppSession({
    apiBase,
    app: { id: 'field' },
    cacheStore: createMemoryCacheStore(),
    fetch: server.fetch,
    kv: createMemoryStore(),
    tokenStore,
  });
  await session.start();
  const coreAuth = createCoreAuth({
    apiBase,
    fetch: server.fetch,
    getSession: () => session,
    tokenStore,
  });
  return { coreAuth, server, session };
}

function authCalls(server) {
  return server.fetch.mock.calls
    .filter(([url]) => url.startsWith(`${apiBase}/api/auth/`))
    .map(([url, init]) => ({
      path: url.slice(`${apiBase}/api/auth`.length),
      method: init.method,
      authorization: header(init, 'authorization'),
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    }));
}

test('listOrganizations lists the memberships with the session token as a bearer', async () => {
  const { coreAuth, server } = await setup();
  expect(await coreAuth.listOrganizations()).toEqual({ data: organizations, error: null });
  expect(authCalls(server)).toEqual([
    {
      path: '/organization/list',
      method: 'GET',
      authorization: `Bearer ${token}`,
      body: undefined,
    },
  ]);
});

test('setActiveOrganization switches the organisation and syncs the session the shell holds', async () => {
  const { coreAuth, server, session } = await setup();
  const { generation, homeRequests } = session.getState();
  expect(await coreAuth.setActiveOrganization({ organizationId: 'org-2' })).toEqual({
    data: organizations[1],
    error: null,
  });
  expect(authCalls(server)).toEqual([
    {
      path: '/organization/set-active',
      method: 'POST',
      authorization: `Bearer ${token}`,
      body: { organizationId: 'org-2' },
    },
  ]);
  const state = session.getState();
  expect(state.user).toEqual({ id: 'ana', organization_id: 'org-2', roles: ['editor'] });
  // Another caller: every screen is rebuilt for the new organisation, from its home page.
  expect(state.generation).toBe(generation + 1);
  expect(state.homeRequests).toBe(homeRequests + 1);
});

test('setActiveOrganization gives a refused switch as an error and leaves the session', async () => {
  const { coreAuth, server, session } = await setup();
  const before = session.getState();
  const syncs = server.fetch.mock.calls.length;
  expect(await coreAuth.setActiveOrganization({ organizationId: 'org-9' })).toEqual({
    data: null,
    error: {
      code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION',
      message: 'Not a member.',
      status: 403,
      statusText: undefined,
    },
  });
  expect(server.fetch.mock.calls).toHaveLength(syncs + 1);
  expect(session.getState()).toBe(before);
});

test('an organisation route an app disables answers as an error with its status', async () => {
  const { coreAuth, server } = await setup();
  server.state.auth = () => ({ status: 404, body: null });
  expect(await coreAuth.listOrganizations()).toEqual({
    data: null,
    error: { status: 404, statusText: undefined },
  });
});

test('refreshSession reads the session and getResolvedUser syncs the caller', async () => {
  const { coreAuth, server } = await setup();
  expect(await coreAuth.refreshSession()).toEqual({
    data: { session: { id: 's1' }, user: { id: 'ana' } },
    error: null,
  });
  server.state.user = { id: 'ana', organization_id: 'org-1', roles: ['admin'] };
  expect(await coreAuth.getResolvedUser()).toEqual({
    user: { id: 'ana', organization_id: 'org-1', roles: ['admin'] },
  });
});

test('signOut ends the session on the server with the bearer token', async () => {
  const { coreAuth, server } = await setup();
  expect(await coreAuth.signOut()).toEqual({ data: { success: true }, error: null });
  expect(authCalls(server)).toEqual([
    { path: '/sign-out', method: 'POST', authorization: `Bearer ${token}`, body: {} },
  ]);
});

test('a call with no session token held sends no authorization', async () => {
  const { coreAuth, server } = await setup({ heldToken: null });
  expect((await coreAuth.listOrganizations()).error.status).toBe(401);
  expect(authCalls(server)[0].authorization).toBe(null);
});
