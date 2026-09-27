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

// Accepting an invitation into an organization the caller already belongs to,
// through the real accept-invitation route of an engine-configured BetterAuth
// instance on the MongoDB auth adapter, with the unique member index in place
// (pnpm test:mongodb).

import { jest } from '@jest/globals';
import * as mongodb from 'mongodb';

// The adapter keeps its client for the process lifetime, so the test records
// every client it creates and closes them afterwards.
const clients = [];
class RecordingMongoClient extends mongodb.MongoClient {
  constructor(...args) {
    super(...args);
    clients.push(this);
  }
}

jest.unstable_mockModule('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

const { betterAuth } = await import('better-auth');
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { default: getBetterAuthConfig } = await import('../getBetterAuthConfig.js');
const { default: ensureAuthIndexes } = await import('./ensureAuthIndexes.js');

const ORIGIN = 'http://localhost:3262';
const PASSWORD = 'correct-horse-battery';
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

let client;
let run = 0;

beforeAll(async () => {
  process.env.BETTER_AUTH_URL = ORIGIN;
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
  await Promise.all([client, ...clients].map((each) => each.close()));
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

async function setup({ organizations }) {
  run += 1;
  const database = `acceptExistingMember${run}`;
  const logger = createLogger();
  let auth;
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      database: {
        id: 'auth_db',
        type: 'MongoDBAuthAdapter',
        properties: { uri: process.env.MONGO_URL, database },
      },
      providers: [],
      emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 },
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
      organizations,
      roles: [],
    },
    createSystemContext: () => ({}),
    getAuth: () => auth,
    logger,
    plugins: { adapters: { MongoDBAuthAdapter }, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  auth = betterAuth(options);
  await ensureAuthIndexes({ auth, logger });
  const { adapter, internalAdapter } = await auth.$context;
  return { adapter, auth, db: client.db(database), internalAdapter };
}

async function post({ auth, path, body, cookie }) {
  const headers = { 'content-type': 'application/json', origin: ORIGIN };
  if (cookie) headers.cookie = cookie;
  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  );
}

// Signs the user up through the real route and returns their session cookie.
async function signUp({ auth, adapter, email, verified = true }) {
  const response = await post({
    auth,
    path: '/sign-up/email',
    body: { email, password: PASSWORD, name: email },
  });
  expect(response.status).toBe(200);
  const { user } = await response.json();
  if (verified) {
    await adapter.update({
      model: 'user',
      where: [{ field: 'id', value: user.id }],
      update: { emailVerified: true },
    });
  }
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  return { cookie, user };
}

async function invite({ adapter, email, organizationId, inviterId, role = 'owner' }) {
  return adapter.create({
    model: 'invitation',
    data: {
      organizationId,
      email,
      role,
      appRoles: ['approver'],
      status: 'pending',
      inviterId,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
}

async function accept({ auth, cookie, invitationId }) {
  return post({ auth, path: '/organization/accept-invitation', body: { invitationId }, cookie });
}

const pinnedOpen = { policy: 'pinned', org: 'default', signup: 'open' };
const tenantOpen = { policy: 'tenant', signup: 'open', create: 'auto' };

test('a member accepting an invitation to their organization succeeds, consumes it and keeps one unchanged row', async () => {
  const { adapter, auth, db } = await setup({ organizations: pinnedOpen });
  // Open signup auto-joins the pinned organization as a member, so an
  // invitation written for this address before sign-up now names an
  // organization the user already belongs to.
  const { cookie, user } = await signUp({ auth, adapter, email: 'joined@example.com' });
  const invitation = await invite({
    adapter,
    email: 'joined@example.com',
    organizationId: 'default',
    inviterId: user.id,
  });
  const response = await accept({ auth, cookie, invitationId: invitation.id });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    invitation: { id: invitation.id, status: 'accepted' },
    member: { userId: user.id, organizationId: 'default', role: 'member' },
  });
  const members = await db.collection('user-members').find({ user_id: user.id }).toArray();
  expect(members).toHaveLength(1);
  expect(members[0].role).toBe('member');
  expect(members[0].app_roles).toBeUndefined();
});

test('a member added by an operator gets the organization active when accepting from an org-less session', async () => {
  const { adapter, auth, db } = await setup({ organizations: tenantOpen });
  const owner = await adapter.create({
    model: 'user',
    data: { email: 'owner@example.com', name: 'Owner', emailVerified: true },
  });
  const organization = await adapter.create({
    model: 'organization',
    data: { name: 'Acme', slug: 'acme', createdAt: new Date() },
  });
  const invitation = await invite({
    adapter,
    email: 'invitee@example.com',
    organizationId: organization.id,
    inviterId: owner.id,
  });
  // A pending invitation mints nothing, so the session starts org-less.
  const { cookie, user } = await signUp({ auth, adapter, email: 'invitee@example.com' });
  await adapter.create({
    model: 'member',
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'member',
      createdAt: new Date(),
    },
  });
  const response = await accept({ auth, cookie, invitationId: invitation.id });
  expect(response.status).toBe(200);
  expect(await db.collection('user-members').countDocuments({ user_id: user.id })).toBe(1);
  const sessions = await db.collection('user-sessions').find({ user_id: user.id }).toArray();
  expect(sessions.map((session) => session.active_organization_id)).toEqual([organization.id]);
});

test('a user who is not yet a member still joins through the route with the invitation role', async () => {
  const { adapter, auth, db } = await setup({ organizations: tenantOpen });
  const owner = await adapter.create({
    model: 'user',
    data: { email: 'owner@example.com', name: 'Owner', emailVerified: true },
  });
  const organization = await adapter.create({
    model: 'organization',
    data: { name: 'Acme', slug: 'acme', createdAt: new Date() },
  });
  const invitation = await invite({
    adapter,
    email: 'newcomer@example.com',
    organizationId: organization.id,
    inviterId: owner.id,
    role: 'admin',
  });
  const { cookie, user } = await signUp({ auth, adapter, email: 'newcomer@example.com' });
  const response = await accept({ auth, cookie, invitationId: invitation.id });
  expect(response.status).toBe(200);
  const members = await db.collection('user-members').find({ user_id: user.id }).toArray();
  expect(members).toEqual([
    expect.objectContaining({
      organization_id: organization.id,
      role: 'admin',
      app_roles: ['approver'],
    }),
  ]);
});

test('a member with an unverified email gets the route verification refusal and the invitation stays pending', async () => {
  const { adapter, auth, db } = await setup({ organizations: pinnedOpen });
  const { cookie, user } = await signUp({
    auth,
    adapter,
    email: 'unverified@example.com',
    verified: false,
  });
  const invitation = await invite({
    adapter,
    email: 'unverified@example.com',
    organizationId: 'default',
    inviterId: user.id,
  });
  const response = await accept({ auth, cookie, invitationId: invitation.id });
  expect(response.status).toBe(403);
  const stored = await db.collection('user-invitations').findOne({ _id: invitation.id });
  expect(stored.status).toBe('pending');
});
