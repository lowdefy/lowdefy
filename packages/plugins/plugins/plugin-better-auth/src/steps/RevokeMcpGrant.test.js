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

import RevokeMcpGrant from './RevokeMcpGrant.js';

function createAuth({ refreshTokens = [{ id: 'rt_1' }, { id: 'rt_2' }] } = {}) {
  const adapter = {
    deleteMany: jest.fn(async () => 1),
    findMany: jest.fn(async () => refreshTokens),
  };
  return { auth: { $context: Promise.resolve({ adapter }) }, adapter };
}

const acting = { system: false, user: { id: 'user_1' } };
const mcp = {
  clientId: 'client_1',
  organizationId: 'org_1',
  tokenStatus: 'valid',
  parseableJwt: true,
  grantedScopes: ['mcp:read'],
};

const where = [
  { field: 'clientId', value: 'client_1' },
  { field: 'userId', value: 'user_1' },
  { field: 'referenceId', value: 'org_1' },
];

test('RevokeMcpGrant deletes the consent, then the access and refresh tokens of the calling grant', async () => {
  const { auth, adapter } = createAuth();
  const result = await RevokeMcpGrant({ acting, auth, mcp, properties: {} });
  expect(adapter.findMany).toHaveBeenCalledWith({ model: 'oauthRefreshToken', where });
  expect(adapter.deleteMany.mock.calls).toEqual([
    [{ model: 'oauthConsent', where }],
    [
      {
        model: 'oauthAccessToken',
        where: [{ field: 'refreshId', operator: 'in', value: ['rt_1', 'rt_2'] }],
      },
    ],
    [{ model: 'oauthRefreshToken', where }],
  ]);
  expect(result).toEqual({ clientId: 'client_1', organizationId: 'org_1', userId: 'user_1' });
});

test('RevokeMcpGrant skips the access-token delete when the grant has no refresh tokens', async () => {
  const { auth, adapter } = createAuth({ refreshTokens: [] });
  await RevokeMcpGrant({ acting, auth, mcp, properties: {} });
  expect(adapter.deleteMany.mock.calls).toEqual([
    [{ model: 'oauthConsent', where }],
    [{ model: 'oauthRefreshToken', where }],
  ]);
});

test('RevokeMcpGrant refuses a caller that did not arrive over MCP', async () => {
  const { auth, adapter } = createAuth();
  await expect(RevokeMcpGrant({ acting, auth, mcp: null, properties: {} })).rejects.toThrow(
    'RevokeMcpGrant can only run for a caller authenticated over MCP'
  );
  await expect(
    RevokeMcpGrant({ acting, auth, mcp: { tokenStatus: 'none' }, properties: {} })
  ).rejects.toThrow('RevokeMcpGrant can only run for a caller authenticated over MCP');
  expect(adapter.deleteMany).not.toHaveBeenCalled();
});

test('RevokeMcpGrant declares caller-scoped authority', () => {
  expect(RevokeMcpGrant.meta).toEqual({ authority: { scope: 'caller' } });
});
