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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { makeSignature } from 'better-auth/crypto';

import getBetterAuthConfig from './getBetterAuthConfig.js';

// Contract test against the installed better-auth release: a real BetterAuth
// instance (memory adapter) under the tenant policy, whose organization client
// endpoints are enabled. A member suspended in an organization must get the
// endpoints' non-member answer there, and ListOrganizations must leave that
// organization out, while their membership elsewhere keeps working.

const ORIGIN = 'https://app.example.com';
const SECRET = 'x'.repeat(32);

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
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isLevelEnabled: vi.fn(() => false),
  };
}

// The caller is an admin of two organizations - active in "active", suspended
// in "suspended" - and their session starts active in activeOrganizationId.
async function createSeededAuth({ activeOrganizationId = 'active' } = {}) {
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
      organizations: { policy: 'tenant', signup: 'open', create: 'operator' },
      roles: [],
    },
    getAuth: () => auth,
    logger: createLogger(),
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: SECRET },
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
      email: 'admin@example.com',
      name: 'Admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const colleague = await adapter.create({
    model: 'user',
    data: {
      email: 'colleague@example.com',
      name: 'Colleague',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  for (const id of ['active', 'suspended']) {
    await adapter.create({
      model: 'organization',
      data: { id, name: id, slug: id, createdAt: new Date() },
      forceAllowId: true,
    });
  }
  await adapter.create({
    model: 'member',
    data: { userId: user.id, organizationId: 'active', role: 'admin', createdAt: new Date() },
  });
  await adapter.create({
    model: 'member',
    data: {
      userId: user.id,
      organizationId: 'suspended',
      role: 'admin',
      appRoles: ['manager'],
      suspended: true,
      createdAt: new Date(),
    },
  });
  await adapter.create({
    model: 'member',
    data: {
      userId: colleague.id,
      organizationId: 'active',
      role: 'member',
      appRoles: ['viewer'],
      suspended: true,
      createdAt: new Date(),
    },
  });
  const invitation = await adapter.create({
    model: 'invitation',
    data: {
      email: 'new@example.com',
      organizationId: 'suspended',
      inviterId: colleague.id,
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
  const token = 'session-token-raw-value';
  await adapter.create({
    model: 'session',
    data: {
      token,
      userId: user.id,
      activeOrganizationId,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const signed = `${token}.${await makeSignature(token, context.secret)}`;
  const cookie = `${context.authCookies.sessionToken.name}=${encodeURIComponent(signed)}`;
  return { auth, cookie, invitation };
}

function get({ auth, cookie, path }) {
  return auth.handler(new Request(`${ORIGIN}/api/auth${path}`, { headers: { cookie } }));
}

function post({ auth, body, cookie, path }) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify(body),
    })
  );
}

async function expectNotAMember(response) {
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION' });
}

test('ListOrganizations leaves out an organization the caller is suspended in', async () => {
  const { auth, cookie } = await createSeededAuth();
  const response = await get({ auth, cookie, path: '/organization/list' });
  expect(response.status).toBe(200);
  const organizations = await response.json();
  expect(organizations.map((organization) => organization.id)).toEqual(['active']);
});

test('setting an organization the caller is suspended in active is refused as for a non-member', async () => {
  const { auth, cookie } = await createSeededAuth();
  await expectNotAMember(
    await post({
      auth,
      cookie,
      path: '/organization/set-active',
      body: { organizationId: 'suspended' },
    })
  );
  await expectNotAMember(
    await post({
      auth,
      cookie,
      path: '/organization/set-active',
      body: { organizationSlug: 'suspended' },
    })
  );
});

test('setting an organization the caller is an unsuspended member of active still works', async () => {
  const { auth, cookie } = await createSeededAuth({ activeOrganizationId: 'suspended' });
  const response = await post({
    auth,
    cookie,
    path: '/organization/set-active',
    body: { organizationId: 'active' },
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: 'active' });
});

test('a caller whose active organization is one they are suspended in can clear it', async () => {
  const { auth, cookie } = await createSeededAuth({ activeOrganizationId: 'suspended' });
  const response = await post({
    auth,
    cookie,
    path: '/organization/set-active',
    body: { organizationId: null },
  });
  expect(response.status).toBe(200);
});

test('member-gated reads in an organization the caller is suspended in are refused', async () => {
  const { auth, cookie } = await createSeededAuth();
  await expectNotAMember(
    await get({ auth, cookie, path: '/organization/list-members?organizationId=suspended' })
  );
  await expectNotAMember(
    await get({
      auth,
      cookie,
      path: '/organization/get-full-organization?organizationSlug=suspended',
    })
  );
});

test('member-gated reads fall back to a suspended active organization', async () => {
  const { auth, cookie } = await createSeededAuth({ activeOrganizationId: 'suspended' });
  await expectNotAMember(await get({ auth, cookie, path: '/organization/get-active-member' }));
});

test('administering an organization the caller is suspended in is refused', async () => {
  const { auth, cookie, invitation } = await createSeededAuth();
  await expectNotAMember(
    await post({
      auth,
      cookie,
      path: '/organization/invite-member',
      body: { email: 'another@example.com', role: 'member', organizationId: 'suspended' },
    })
  );
  // cancel-invitation names only the invitation, in the suspended organization.
  await expectNotAMember(
    await post({
      auth,
      cookie,
      path: '/organization/cancel-invitation',
      body: { invitationId: invitation.id },
    })
  );
  await expectNotAMember(
    await post({ auth, cookie, path: '/organization/leave', body: { organizationId: 'suspended' } })
  );
});

test('an admin lists a suspended member of their organization with the suspended flag', async () => {
  const { auth, cookie } = await createSeededAuth();
  const response = await get({
    auth,
    cookie,
    path: '/organization/list-members?organizationId=active',
  });
  expect(response.status).toBe(200);
  const { members } = await response.json();
  const colleague = members.find((member) => member.user.email === 'colleague@example.com');
  expect(colleague).toMatchObject({ suspended: true, appRoles: ['viewer'] });
});
