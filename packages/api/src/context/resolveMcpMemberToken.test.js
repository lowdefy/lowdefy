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
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import { registerOrganizationBinding } from '../routes/auth/organizations/getOrganizationBinding.js';
import resolveAuthentication from './resolveAuthentication.js';

const token = `ldf_mcp_${'a'.repeat(43)}`;
const tokenHash = createHash('sha256').update(token).digest('hex');

function tokenRow(overrides = {}) {
  return {
    id: 'token_1',
    organizationId: 'org_1',
    userId: 'user_1',
    memberId: 'member_1',
    name: 'nightly worker',
    hash: tokenHash,
    start: token.slice(0, 12),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: null,
    lastUsedAt: null,
    ...overrides,
  };
}

function mockAuth({
  consent = { id: 'consent_1' },
  jwksRows = [],
  member = { id: 'member_1', role: 'member', appRoles: ['builder'] },
  row = tokenRow(),
  update = jest.fn().mockResolvedValue({}),
  user = { id: 'user_1', email: 'worker@example.com' },
} = {}) {
  const findOne = jest.fn(async ({ model, where }) => {
    if (model === 'mcpToken') {
      return where[0].value === row?.hash ? row : null;
    }
    if (model === 'user') return user;
    if (model === 'member') return member;
    if (model === 'oauthConsent') return consent;
    return null;
  });
  const findMany = jest.fn(async ({ model }) => (model === 'jwks' ? jwksRows : []));
  const auth = {
    api: { getSession: jest.fn() },
    $context: Promise.resolve({
      adapter: { count: jest.fn().mockResolvedValue(0), findMany, findOne, update },
    }),
  };
  return { auth, findOne, update };
}

function mcpContext() {
  return { config: {}, logger: { debug: jest.fn(), warn: jest.fn() } };
}

function bearerHeaders(value) {
  return new Headers({ authorization: `Bearer ${value}` });
}

async function resolve({ auth, bearer = token }) {
  const context = mcpContext();
  await resolveAuthentication(context, { auth, headers: bearerHeaders(bearer), mcp: true });
  return context;
}

const MEMBER_GONE = "This token's member can no longer use it.";

test('a member token resolves its member as the MCP caller with every MCP scope', async () => {
  const { auth, findOne } = mockAuth();
  const context = await resolve({ auth });
  expect(findOne).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'hash', value: tokenHash }],
  });
  expect(context.mcpAuth).toEqual({
    tokenStatus: 'valid',
    tokenId: 'token_1',
    organizationId: 'org_1',
    grantedScopes: ['mcp:read', 'mcp:write'],
  });
  expect(context.user).toEqual({
    id: 'user_1',
    email: 'worker@example.com',
    roles: ['builder'],
    org_roles: ['member'],
    attributes: {},
    active_organization_id: 'org_1',
    organization_id: 'org_1',
    two_factor_enrolled: false,
    auth_method: 'mcp',
  });
});

test('a member token never reads an OAuth consent or verifies as a JWT', async () => {
  const { auth, findOne } = mockAuth();
  await resolve({ auth });
  const models = findOne.mock.calls.map(([{ model }]) => model);
  expect(models).not.toContain('oauthConsent');
});

test('an unknown member token is refused as switched off or missing', async () => {
  const { auth } = mockAuth({ row: null });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth).toEqual({
    tokenStatus: 'invalid',
    memberToken: true,
    description: 'This token was switched off or does not exist.',
  });
});

test('an expired member token is refused as expired', async () => {
  const { auth, findOne } = mockAuth({
    row: tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
  });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth).toEqual({
    tokenStatus: 'invalid',
    memberToken: true,
    description: 'This token has expired.',
  });
  expect(findOne).not.toHaveBeenCalledWith(expect.objectContaining({ model: 'user' }));
});

test('a member token with a future expiry is served', async () => {
  const { auth } = mockAuth({ row: tokenRow({ expiresAt: new Date(Date.now() + 60000) }) });
  const context = await resolve({ auth });
  expect(context.mcpAuth.tokenStatus).toBe('valid');
});

test('a member token for an organization other than the pinned one is refused', async () => {
  const { auth, findOne } = mockAuth({ row: tokenRow({ organizationId: 'other-org' }) });
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'org_1' } });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth.description).toBe(MEMBER_GONE);
  expect(findOne).not.toHaveBeenCalledWith(expect.objectContaining({ model: 'member' }));
});

test('a member token whose member row is gone is refused', async () => {
  const { auth } = mockAuth({ member: null });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth).toEqual({
    tokenStatus: 'invalid',
    memberToken: true,
    description: MEMBER_GONE,
  });
});

test('a member token made for an earlier member row is refused after the member rejoins', async () => {
  const { auth } = mockAuth({ member: { id: 'member_2', role: 'member', appRoles: [] } });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth.description).toBe(MEMBER_GONE);
});

test('a member token whose user row is gone is refused', async () => {
  const { auth } = mockAuth({ user: null });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth.description).toBe(MEMBER_GONE);
});

test('a member token whose user is banned with no expiry is refused', async () => {
  const { auth } = mockAuth({ user: { id: 'user_1', banned: true, banExpires: null } });
  const context = await resolve({ auth });
  expect(context.user).toBe(null);
  expect(context.mcpAuth.description).toBe(MEMBER_GONE);
});

test('a member token whose user ban has expired is served', async () => {
  const { auth } = mockAuth({
    user: { id: 'user_1', banned: true, banExpires: new Date(Date.now() - 1000) },
  });
  const context = await resolve({ auth });
  expect(context.mcpAuth.tokenStatus).toBe('valid');
});

test('a member token never used before records lastUsedAt', async () => {
  const { auth, update } = mockAuth();
  await resolve({ auth });
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'id', value: 'token_1' }],
    update: { lastUsedAt: expect.any(Date) },
  });
});

test('a member token used under an hour ago skips the lastUsedAt write', async () => {
  const { auth, update } = mockAuth({
    row: tokenRow({ lastUsedAt: new Date(Date.now() - 59 * 60 * 1000) }),
  });
  await resolve({ auth });
  expect(update).not.toHaveBeenCalled();
});

test('a member token last used over an hour ago records lastUsedAt again', async () => {
  const { auth, update } = mockAuth({
    row: tokenRow({ lastUsedAt: new Date(Date.now() - 61 * 60 * 1000) }),
  });
  await resolve({ auth });
  expect(update).toHaveBeenCalledTimes(1);
});

test('a failed lastUsedAt write does not fail the call', async () => {
  const { auth } = mockAuth({ update: jest.fn().mockRejectedValue(new Error('write failed')) });
  const context = await resolve({ auth });
  expect(context.mcpAuth.tokenStatus).toBe('valid');
  expect(context.user.id).toBe('user_1');
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
});

test('a refused member token records no lastUsedAt', async () => {
  const { auth, update } = mockAuth({ member: null });
  await resolve({ auth });
  expect(update).not.toHaveBeenCalled();
});

describe('OAuth access token ban check', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;
  let privateKey;
  let jwksRows;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('EdDSA');
    privateKey = keyPair.privateKey;
    jwksRows = [
      {
        id: 'kid_1',
        publicKey: JSON.stringify(await exportJWK(keyPair.publicKey)),
        privateKey: 'encrypted-and-never-read',
        createdAt: new Date(),
        alg: 'EdDSA',
      },
    ];
    process.env.BETTER_AUTH_URL = 'https://app.test.com';
  });

  afterAll(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  function mintAccessToken() {
    return new SignJWT({ scope: 'mcp:read', organization_id: 'org_1', client_id: 'client_1' })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'kid_1' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .setIssuer('https://app.test.com/api/auth')
      .setAudience('https://app.test.com/api/mcp')
      .setSubject('user_1')
      .sign(privateKey);
  }

  test('an OAuth access token whose user is banned resolves invalid with no membership', async () => {
    const { auth } = mockAuth({
      jwksRows,
      user: { id: 'user_1', banned: true, banExpires: new Date(Date.now() + 60000) },
    });
    const context = await resolve({ auth, bearer: await mintAccessToken() });
    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({
      clientId: 'client_1',
      organizationId: 'org_1',
      tokenStatus: 'invalid',
      parseableJwt: true,
      noMembership: true,
    });
  });

  test('an OAuth access token whose user ban has expired is served', async () => {
    const { auth } = mockAuth({
      jwksRows,
      user: { id: 'user_1', banned: true, banExpires: new Date(Date.now() - 1000) },
    });
    const context = await resolve({ auth, bearer: await mintAccessToken() });
    expect(context.mcpAuth.tokenStatus).toBe('valid');
    expect(context.user.auth_method).toBe('mcp');
  });
});
