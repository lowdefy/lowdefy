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

import { jest } from '@jest/globals';

import callPluginEndpoint from './callPluginEndpoint.js';
import createMockAuth from '../../../test/createMockAuth.js';

const sessionCaller = {
  system: false,
  user: {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    image: 'https://example.com/u1.png',
    emailVerified: true,
    activeOrganizationId: 'org-1',
  },
};

const systemCaller = { system: true, user: null };

test('callPluginEndpoint injects an acting session with role admin and doctored options', async () => {
  const banUser = jest.fn().mockResolvedValue({ user: { id: 'user-2' } });
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  const result = await callPluginEndpoint({
    acting: sessionCaller,
    auth,
    body: { userId: 'user-2' },
    endpointKey: 'banUser',
    pluginId: 'admin',
  });
  expect(result).toEqual({ user: { id: 'user-2' } });
  expect(banUser).toHaveBeenCalledTimes(1);
  const input = banUser.mock.calls[0][0];
  expect(input.body).toEqual({ userId: 'user-2' });
  expect(input.headers).toBeInstanceOf(Headers);
  expect(input.context.session.user.role).toEqual('admin');
  expect(input.context.options.database).toBe(undefined);
  expect(input.context.options.secondaryStorage).toBe(undefined);
});

test('callPluginEndpoint does not mutate the real auth options', async () => {
  const banUser = jest.fn().mockResolvedValue({});
  const { auth, authContext } = createMockAuth({ adminEndpoints: { banUser } });
  await callPluginEndpoint({
    acting: systemCaller,
    auth,
    body: { userId: 'user-2' },
    endpointKey: 'banUser',
    pluginId: 'admin',
  });
  expect(authContext.options.database).toEqual({ real: 'database' });
  expect(authContext.options.secondaryStorage).toEqual({ real: 'secondaryStorage' });
});

test('callPluginEndpoint for a session caller uses the caller id and activeOrganizationId', async () => {
  const banUser = jest.fn().mockResolvedValue({});
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  await callPluginEndpoint({
    acting: sessionCaller,
    auth,
    body: { userId: 'user-2' },
    endpointKey: 'banUser',
    pluginId: 'admin',
  });
  const { session } = banUser.mock.calls[0][0].context;
  expect(session.user).toEqual({
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    image: 'https://example.com/u1.png',
    emailVerified: true,
    role: 'admin',
  });
  expect(session.session.userId).toEqual('user-1');
  expect(session.session.activeOrganizationId).toEqual('org-1');
});

test('callPluginEndpoint for a system caller uses the lowdefy system identity', async () => {
  const banUser = jest.fn().mockResolvedValue({});
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  await callPluginEndpoint({
    acting: systemCaller,
    auth,
    body: { userId: 'user-2' },
    endpointKey: 'banUser',
    pluginId: 'admin',
  });
  const { session } = banUser.mock.calls[0][0].context;
  expect(session.user).toEqual({
    id: 'lowdefy:system',
    email: 'system@lowdefy.internal',
    name: 'Lowdefy System',
    emailVerified: true,
    image: null,
    role: 'admin',
  });
  expect(session.session.userId).toEqual('lowdefy:system');
  expect(session.session.activeOrganizationId).toEqual(null);
});

test('callPluginEndpoint passes query for GET-style endpoints', async () => {
  const listUsers = jest.fn().mockResolvedValue({ users: [] });
  const { auth } = createMockAuth({ adminEndpoints: { listUsers } });
  await callPluginEndpoint({
    acting: systemCaller,
    auth,
    endpointKey: 'listUsers',
    pluginId: 'admin',
    query: { limit: 10 },
  });
  const input = listUsers.mock.calls[0][0];
  expect(input.query).toEqual({ limit: 10 });
  expect(input.body).toBe(undefined);
  expect(input.headers).toBeInstanceOf(Headers);
});

test('callPluginEndpoint rethrows APIError-shaped failures with the rail message', async () => {
  const apiError = new Error('generic');
  apiError.status = 'BAD_REQUEST';
  apiError.body = { code: 'ROLE_NOT_FOUND', message: 'ROLE_NOT_FOUND: superuser' };
  const banUser = jest.fn().mockRejectedValue(apiError);
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  await expect(
    callPluginEndpoint({
      acting: systemCaller,
      auth,
      body: { userId: 'user-2' },
      endpointKey: 'banUser',
      pluginId: 'admin',
    })
  ).rejects.toThrow('ROLE_NOT_FOUND: superuser');
});

test('callPluginEndpoint rethrows APIError code when the body has no message', async () => {
  const apiError = new Error('generic');
  apiError.status = 'FORBIDDEN';
  apiError.body = { code: 'YOU_ARE_NOT_ALLOWED_TO_BAN_USERS' };
  const banUser = jest.fn().mockRejectedValue(apiError);
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  await expect(
    callPluginEndpoint({
      acting: systemCaller,
      auth,
      body: { userId: 'user-2' },
      endpointKey: 'banUser',
      pluginId: 'admin',
    })
  ).rejects.toThrow('YOU_ARE_NOT_ALLOWED_TO_BAN_USERS');
});

test('callPluginEndpoint rethrows non-APIError failures unchanged', async () => {
  const failure = new Error('database exploded');
  const banUser = jest.fn().mockRejectedValue(failure);
  const { auth } = createMockAuth({ adminEndpoints: { banUser } });
  await expect(
    callPluginEndpoint({
      acting: systemCaller,
      auth,
      body: { userId: 'user-2' },
      endpointKey: 'banUser',
      pluginId: 'admin',
    })
  ).rejects.toBe(failure);
});

test('callPluginEndpoint throws when the plugin is not configured', async () => {
  const { auth } = createMockAuth();
  const authContext = await auth.$context;
  authContext.options.plugins = [];
  await expect(
    callPluginEndpoint({
      acting: systemCaller,
      auth,
      body: {},
      endpointKey: 'banUser',
      pluginId: 'admin',
    })
  ).rejects.toThrow('BetterAuth plugin "admin" is not configured on the auth instance.');
});

test('callPluginEndpoint throws when the endpoint key does not exist on the plugin', async () => {
  const { auth } = createMockAuth();
  await expect(
    callPluginEndpoint({
      acting: systemCaller,
      auth,
      body: {},
      endpointKey: 'banUser',
      pluginId: 'admin',
    })
  ).rejects.toThrow('BetterAuth plugin "admin" has no endpoint "banUser".');
});
