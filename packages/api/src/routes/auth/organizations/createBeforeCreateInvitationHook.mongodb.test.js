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

// The open-invitation cap per organization, through the real invite-member
// route of a BetterAuth instance with Lowdefy's organization plugin on the
// MongoDB auth adapter (pnpm test:mongodb).

import { randomUUID } from 'node:crypto';
import { vi, afterAll, beforeAll, expect, test } from 'vitest';
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

vi.doMock('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

const { betterAuth } = await import('better-auth');
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { default: buildOrganizationPlugin } = await import('./buildOrganizationPlugin.js');

const ORIGIN = 'http://localhost:3263';
const PASSWORD = 'correct-horse-battery';

let client;
let run = 0;

beforeAll(async () => {
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  await Promise.all([client, ...clients].map((each) => each.close()));
});

async function setup({ organizations = {} } = {}) {
  run += 1;
  const database = `invitationLimit${run}`;
  let auth;
  auth = betterAuth({
    baseURL: ORIGIN,
    secret: 'invitation-limit-test-secret-0123456789abcdef',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: false },
    advanced: { database: { generateId: () => randomUUID() } },
    plugins: [
      buildOrganizationPlugin({
        authConfig: { organizations: { creatorAppRoles: [], ...organizations } },
        getAuth: () => auth,
        sendInvitationEmail: async () => {},
      }),
    ],
  });
  const { adapter } = await auth.$context;
  const signUp = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email: 'owner@example.com', password: PASSWORD, name: 'Owner' }),
    })
  );
  expect(signUp.status).toBe(200);
  const { user } = await signUp.json();
  const cookie = signUp.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  const organization = await adapter.create({
    model: 'organization',
    data: { name: 'Acme', slug: 'acme', createdAt: new Date() },
  });
  await adapter.create({
    model: 'member',
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'owner',
      createdAt: new Date(),
    },
  });
  return { adapter, auth, cookie, db: client.db(database), organization, user };
}

async function seedInvitations({ adapter, organization, user, count, expired = false }) {
  const expiresAt = new Date(Date.now() + (expired ? -1 : 1) * 3600 * 1000);
  for (let index = 0; index < count; index += 1) {
    await adapter.create({
      model: 'invitation',
      data: {
        organizationId: organization.id,
        email: `${expired ? 'expired' : 'open'}-${index}@example.com`,
        role: 'member',
        status: 'pending',
        inviterId: user.id,
        expiresAt,
        createdAt: new Date(),
      },
    });
  }
}

async function invite({ auth, cookie, organization, email }) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth/organization/invite-member`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, cookie },
      body: JSON.stringify({ email, role: 'member', organizationId: organization.id }),
    })
  );
}

test('an organization with 100 open invitations accepts a 101st when invitationLimit is unset', async () => {
  const { adapter, auth, cookie, db, organization, user } = await setup();
  await seedInvitations({ adapter, organization, user, count: 100 });

  const response = await invite({ auth, cookie, organization, email: 'next@example.com' });
  expect(response.status).toBe(200);
  expect(await db.collection('user-invitations').countDocuments({ status: 'pending' })).toBe(101);
});

test('invitationLimit: 2 refuses a third open invitation with INVITATION_LIMIT_REACHED', async () => {
  const { adapter, auth, cookie, db, organization, user } = await setup({
    organizations: { invitationLimit: 2 },
  });
  await seedInvitations({ adapter, organization, user, count: 2 });

  const response = await invite({ auth, cookie, organization, email: 'third@example.com' });
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: 'INVITATION_LIMIT_REACHED' });
  expect(await db.collection('user-invitations').countDocuments({})).toBe(2);
});

test('expired invitations do not count toward invitationLimit', async () => {
  const { adapter, auth, cookie, organization, user } = await setup({
    organizations: { invitationLimit: 2 },
  });
  await seedInvitations({ adapter, organization, user, count: 150, expired: true });
  await seedInvitations({ adapter, organization, user, count: 1 });

  const second = await invite({ auth, cookie, organization, email: 'second@example.com' });
  expect(second.status).toBe(200);
  const third = await invite({ auth, cookie, organization, email: 'third@example.com' });
  expect(third.status).toBe(403);
  expect(await third.json()).toMatchObject({ code: 'INVITATION_LIMIT_REACHED' });
});

test('invitationLimit above 100 is enforced past the adapter page BetterAuth counts with', async () => {
  const { adapter, auth, cookie, organization, user } = await setup({
    organizations: { invitationLimit: 120 },
  });
  await seedInvitations({ adapter, organization, user, count: 119 });

  const last = await invite({ auth, cookie, organization, email: 'last@example.com' });
  expect(last.status).toBe(200);
  const over = await invite({ auth, cookie, organization, email: 'over@example.com' });
  expect(over.status).toBe(403);
  expect(await over.json()).toMatchObject({ code: 'INVITATION_LIMIT_REACHED' });
});

test('re-inviting an address at the limit replaces its invitation instead of counting it', async () => {
  const { adapter, auth, cookie, db, organization, user } = await setup({
    organizations: { invitationLimit: 2 },
  });
  await seedInvitations({ adapter, organization, user, count: 2 });

  const response = await invite({ auth, cookie, organization, email: 'open-0@example.com' });
  expect(response.status).toBe(200);
  const invitations = db.collection('user-invitations');
  expect(await invitations.countDocuments({ email: 'open-0@example.com' })).toBe(2);
  expect(
    await invitations.countDocuments({ email: 'open-0@example.com', status: 'canceled' })
  ).toBe(1);
  expect(await invitations.countDocuments({ status: 'pending' })).toBe(2);
});
