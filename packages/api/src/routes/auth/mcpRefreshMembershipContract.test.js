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
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { decodeJwt } from 'jose';

import getBetterAuthConfig from './getBetterAuthConfig.js';

// Contract test against the installed @better-auth/oauth-provider release: a
// real BetterAuth instance (memory adapter) serves the refresh_token grant for
// an MCP grant, and the grant must stop minting once the user is no longer a
// member of the organization it acts in - an MCP client only re-runs sign-in
// and the organization choice when its refresh fails.
// A rotated refresh token presented again within the reuse interval (several
// sessions of one client refreshing at once) replays the rotation's tokens;
// presented after it, the reuse revokes every token of that client and user.

const ORIGIN = 'https://app.example.com';
const RESOURCE = `${ORIGIN}/api/mcp`;
const REFRESH_TOKEN = 'refresh-token-raw-value';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeEach(() => {
  process.env.BETTER_AUTH_URL = ORIGIN;
});

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

function createLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

async function createSeededAuth() {
  let auth;
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      providers: [],
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
        crossSubDomainCookies: { enabled: false },
      },
      account: { accountLinking: { enabled: true, trustedProviders: [] } },
      rateLimit: { enabled: false, window: 60, max: 100 },
      authPages: { signIn: '/login', error: '/auth/error' },
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
      roles: [],
      oauthProvider: { consentPage: '/oauth/consent' },
    },
    getAuth: () => auth,
    logger: createLogger(),
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  const db = {};
  auth = betterAuth({ ...options, database: memoryAdapter(db) });
  const context = await auth.$context;
  Object.values(context.tables).forEach(({ modelName }) => {
    db[modelName] = [];
  });
  const { adapter } = context;
  const user = await adapter.create({
    model: 'user',
    data: {
      email: 'member@example.com',
      name: 'Member',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const member = await adapter.create({
    model: 'member',
    data: { userId: user.id, organizationId: 'default', role: 'member', createdAt: new Date() },
  });
  await adapter.create({
    model: 'oauthClient',
    data: {
      clientId: 'client_1',
      disabled: false,
      skipConsent: false,
      scopes: ['mcp:read', 'offline_access'],
      redirectUris: ['http://127.0.0.1/callback'],
      tokenEndpointAuthMethod: 'none',
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      requirePKCE: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await adapter.create({
    model: 'oauthResource',
    data: {
      identifier: RESOURCE,
      name: RESOURCE,
      disabled: false,
      dpopBoundAccessTokensRequired: false,
      policyVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await adapter.create({
    model: 'oauthRefreshToken',
    data: {
      token: createHash('sha256').update(REFRESH_TOKEN).digest('base64url'),
      clientId: 'client_1',
      userId: user.id,
      referenceId: 'default',
      scopes: ['mcp:read', 'offline_access'],
      resources: [RESOURCE],
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
  return { adapter, auth, member };
}

function refresh({ auth }) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
        client_id: 'client_1',
        resource: RESOURCE,
      }),
    })
  );
}

test('the refresh grant mints an access token carrying the organization while the user is a member', async () => {
  const { auth } = await createSeededAuth();
  const response = await refresh({ auth });
  expect(response.status).toBe(200);
  const { access_token: accessToken } = await response.json();
  expect(decodeJwt(accessToken)).toMatchObject({ organization_id: 'default', aud: RESOURCE });
});

async function seedOtherRefreshToken({ adapter }) {
  const [{ userId }] = await adapter.findMany({ model: 'oauthRefreshToken' });
  return adapter.create({
    model: 'oauthRefreshToken',
    data: {
      token: createHash('sha256').update('other-session-refresh-token').digest('base64url'),
      clientId: 'client_1',
      userId,
      referenceId: 'default',
      scopes: ['mcp:read', 'offline_access'],
      resources: [RESOURCE],
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
}

test('a rotated refresh token presented again within the reuse interval gets the same tokens and revokes nothing', async () => {
  const { adapter, auth } = await createSeededAuth();
  const other = await seedOtherRefreshToken({ adapter });
  const first = await refresh({ auth });
  const second = await refresh({ auth });
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  const firstBody = await first.json();
  const secondBody = await second.json();
  expect(secondBody.refresh_token).toBe(firstBody.refresh_token);
  expect(secondBody.access_token).toBe(firstBody.access_token);
  const otherAfter = await adapter.findOne({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: other.id }],
  });
  expect(otherAfter.revoked).toBeFalsy();
});

test('a rotated refresh token presented again after the reuse interval revokes the family', async () => {
  const { adapter, auth } = await createSeededAuth();
  const other = await seedOtherRefreshToken({ adapter });
  expect((await refresh({ auth })).status).toBe(200);
  await adapter.updateMany({
    model: 'oauthRefreshToken',
    where: [{ field: 'rotatedAt', operator: 'ne', value: null }],
    update: { rotationReplayExpiresAt: new Date(Date.now() - 1000) },
  });
  const stale = await refresh({ auth });
  expect(stale.status).toBe(400);
  expect(await stale.json()).toMatchObject({ error: 'invalid_grant' });
  expect(
    await adapter.findOne({ model: 'oauthRefreshToken', where: [{ field: 'id', value: other.id }] })
  ).toBeNull();
});

test('the refresh grant answers invalid_grant once the user is no longer a member of the organization', async () => {
  const { adapter, auth, member } = await createSeededAuth();
  await adapter.delete({ model: 'member', where: [{ field: 'id', value: member.id }] });
  const response = await refresh({ auth });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: 'invalid_grant' });
});
