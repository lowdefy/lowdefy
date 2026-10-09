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

import { createHash } from 'node:crypto';

import { jest } from '@jest/globals';

import CreateMcpToken from './CreateMcpToken.js';

const sessionCaller = { system: false, user: { id: 'user_1', organization_id: 'org_1' } };

function createAuth({ member = { id: 'member_1' }, tokenModel = true } = {}) {
  const adapter = {
    findOne: jest.fn(async () => member),
    create: jest.fn(async ({ data }) => ({ id: 'token_1', ...data })),
  };
  const plugins = tokenModel ? [{ id: 'oauth-provider' }, { id: 'lowdefy-mcp-token' }] : [];
  return { auth: { $context: Promise.resolve({ adapter }), options: { plugins } }, adapter };
}

test('CreateMcpToken writes a hashed token for the caller member and returns the token once', async () => {
  const { auth, adapter } = createAuth();
  const before = Date.now();
  const result = await CreateMcpToken({
    acting: sessionCaller,
    auth,
    properties: { name: ' nightly worker ', expiresInDays: 90 },
  });

  expect(result.token).toMatch(/^ldf_mcp_[A-Za-z0-9_-]{43}$/);
  expect(result.start).toBe(result.token.slice(0, 12));
  expect(result.id).toBe('token_1');
  const expiresInMs = result.expiresAt.getTime() - before;
  expect(expiresInMs).toBeGreaterThanOrEqual(90 * 24 * 60 * 60 * 1000);
  expect(expiresInMs).toBeLessThan(90 * 24 * 60 * 60 * 1000 + 5000);

  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_1' },
    ],
  });
  const { data } = adapter.create.mock.calls[0][0];
  expect(adapter.create.mock.calls[0][0].model).toBe('mcpToken');
  expect(data).toEqual({
    organizationId: 'org_1',
    userId: 'user_1',
    memberId: 'member_1',
    name: 'nightly worker',
    hash: createHash('sha256').update(result.token).digest('hex'),
    start: result.start,
    createdAt: expect.any(Date),
    expiresAt: result.expiresAt,
    lastUsedAt: null,
  });
  expect(JSON.stringify(data)).not.toContain(result.token);
});

test('CreateMcpToken with expiresInDays null makes a token that never expires', async () => {
  const { auth, adapter } = createAuth();
  const result = await CreateMcpToken({
    acting: sessionCaller,
    auth,
    properties: { name: 'build-01', expiresInDays: null },
  });
  expect(result.expiresAt).toBe(null);
  expect(adapter.create.mock.calls[0][0].data.expiresAt).toBe(null);
});

test('CreateMcpToken makes a different token each time', async () => {
  const { auth } = createAuth();
  const properties = { name: 'build-01', expiresInDays: null };
  const first = await CreateMcpToken({ acting: sessionCaller, auth, properties });
  const second = await CreateMcpToken({ acting: sessionCaller, auth, properties });
  expect(first.token).not.toBe(second.token);
});

test.each([
  ['an MCP caller', 'mcp'],
  ['an apiKey strategy caller', 'apiKey'],
  ['a jwt strategy caller', 'jwt'],
])('CreateMcpToken refuses %s', async (_, authMethod) => {
  const { auth, adapter } = createAuth();
  await expect(
    CreateMcpToken({
      acting: { system: false, user: { ...sessionCaller.user, auth_method: authMethod } },
      auth,
      properties: { name: 'build-01', expiresInDays: null },
    })
  ).rejects.toThrow('member tokens are created from a signed-in session');
  expect(adapter.create).not.toHaveBeenCalled();
});

test('CreateMcpToken refuses in an app with no MCP authorization server', async () => {
  const { auth, adapter } = createAuth({ tokenModel: false });
  await expect(
    CreateMcpToken({
      acting: sessionCaller,
      auth,
      properties: { name: 'build-01', expiresInDays: null },
    })
  ).rejects.toThrow(
    'CreateMcpToken needs the MCP authorization server - set "auth.oauthProvider".'
  );
  expect(adapter.create).not.toHaveBeenCalled();
});

test('CreateMcpToken refuses a caller with no member row in the active organization', async () => {
  const { auth, adapter } = createAuth({ member: null });
  await expect(
    CreateMcpToken({
      acting: sessionCaller,
      auth,
      properties: { name: 'build-01', expiresInDays: null },
    })
  ).rejects.toThrow('CreateMcpToken found no member row for the caller in organization "org_1".');
  expect(adapter.create).not.toHaveBeenCalled();
});

test('CreateMcpToken refuses a caller with no active organization', async () => {
  const { auth } = createAuth();
  await expect(
    CreateMcpToken({
      acting: { system: false, user: { id: 'user_1' } },
      auth,
      properties: { name: 'build-01', expiresInDays: null },
    })
  ).rejects.toThrow('CreateMcpToken needs the caller to have an active organization.');
});

test.each([[undefined], [''], ['   '], [42]])('CreateMcpToken refuses name %p', async (name) => {
  const { auth } = createAuth();
  await expect(
    CreateMcpToken({ acting: sessionCaller, auth, properties: { name, expiresInDays: null } })
  ).rejects.toThrow('CreateMcpToken requires a non-empty string "name" property.');
});

test('CreateMcpToken requires expiresInDays to be given', async () => {
  const { auth } = createAuth();
  await expect(
    CreateMcpToken({ acting: sessionCaller, auth, properties: { name: 'build-01' } })
  ).rejects.toThrow('CreateMcpToken requires an "expiresInDays" property');
});

test.each([[0], [-5], [1.5], ['30']])('CreateMcpToken refuses expiresInDays %p', async (days) => {
  const { auth } = createAuth();
  await expect(
    CreateMcpToken({
      acting: sessionCaller,
      auth,
      properties: { name: 'build-01', expiresInDays: days },
    })
  ).rejects.toThrow(`Received ${JSON.stringify(days)}.`);
});
