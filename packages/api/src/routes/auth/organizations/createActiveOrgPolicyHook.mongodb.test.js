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

// The tenant signup mint against a real BetterAuth instance, the real MongoDB
// auth adapter and a real server (pnpm test:mongodb). The ordering tests pause
// a session inside the real adapter so the interleaving the unit tests model
// is reproduced exactly; the parallel test fires many sessions at once.

import { randomUUID } from 'node:crypto';
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
const { default: buildOrganizationPlugin } = await import('./buildOrganizationPlugin.js');
const { default: createActiveOrgPolicyHook } = await import('./createActiveOrgPolicyHook.js');

const tenant = { policy: 'tenant', signup: 'open', create: 'auto' };

let client;
let run = 0;

beforeAll(async () => {
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  await Promise.all([client, ...clients].map((each) => each.close()));
});

async function setup() {
  run += 1;
  const database = `tenantMint${run}`;
  let auth;
  auth = betterAuth({
    baseURL: 'http://localhost:3261',
    secret: 'tenant-mint-test-secret-0123456789abcdef',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    advanced: { database: { generateId: () => randomUUID() } },
    plugins: [buildOrganizationPlugin({ getAuth: () => auth })],
  });
  const context = await auth.$context;
  const hook = createActiveOrgPolicyHook({
    getAuth: () => auth,
    logger: { warn: jest.fn() },
    organizations: tenant,
  });
  async function createUser(name) {
    return context.internalAdapter.createUser({
      email: `${name}@example.com`,
      name,
      emailVerified: true,
    });
  }
  return { adapter: context.adapter, createUser, db: client.db(database), hook };
}

// Pause the next adapter.create matching `match`, after (or before) it
// writes, until release() is called.
function pauseCreate({ adapter, match, after }) {
  const create = adapter.create;
  let reached;
  let release;
  const reachedPromise = new Promise((resolve) => {
    reached = resolve;
  });
  const released = new Promise((resolve) => {
    release = resolve;
  });
  let armed = true;
  adapter.create = async (args) => {
    if (!armed || !match(args)) {
      return create(args);
    }
    armed = false;
    if (!after) {
      reached();
      await released;
      return create(args);
    }
    const result = await create(args);
    reached();
    await released;
    return result;
  };
  return { reached: reachedPromise, release };
}

async function stateOf({ db, userId }) {
  const organizations = await db
    .collection('user-organizations')
    .find({ slug: { $regex: `^org-${userId}` } })
    .toArray();
  const members = await db.collection('user-members').find({ user_id: userId }).toArray();
  return { organizations, members };
}

test('many concurrent sessions per user mint one organization with one owner row each', async () => {
  const { createUser, db, hook } = await setup();
  const users = await Promise.all(Array.from({ length: 25 }, (_, n) => createUser(`user${n}`)));
  await Promise.all(
    users.map(async (user) => {
      const results = await Promise.all(Array.from({ length: 4 }, () => hook({ userId: user.id })));
      const active = new Set(results.map((result) => result.data.activeOrganizationId));
      expect(active.size).toBe(1);
    })
  );
  for (const user of users) {
    const { organizations, members } = await stateOf({ db, userId: user.id });
    expect(organizations).toHaveLength(1);
    expect(organizations[0].mint_pending).toBe(false);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
  }
});

test.each([
  [
    'reads members between the other session organization and member writes',
    ({ model }) => model === 'organization',
    true,
  ],
  [
    'passes the member read with the other session, then writes second',
    ({ model }) => model === 'member',
    false,
  ],
])('a session that %s ends with the same single owner row', async (_, match, after) => {
  const { adapter, createUser, db, hook } = await setup();
  const user = await createUser('racer');
  const paused = pauseCreate({ adapter, match, after });
  const a = hook({ userId: user.id });
  await paused.reached;
  const b = await hook({ userId: user.id });
  paused.release();
  expect(await a).toEqual(b);
  const { organizations, members } = await stateOf({ db, userId: user.id });
  expect(organizations).toHaveLength(1);
  expect(members).toHaveLength(1);
});

test('an organization everyone left is never handed back - the user gets a fresh one', async () => {
  const { adapter, createUser, db, hook } = await setup();
  const user = await createUser('leaver');
  const first = await hook({ userId: user.id });
  await adapter.deleteMany({ model: 'member', where: [{ field: 'userId', value: user.id }] });
  const second = await hook({ userId: user.id });
  expect(second.data.activeOrganizationId).not.toBe(first.data.activeOrganizationId);
  const { organizations, members } = await stateOf({ db, userId: user.id });
  expect(organizations.map((organization) => organization.slug).sort()).toEqual([
    `org-${user.id}`,
    `org-${user.id}-2`,
  ]);
  expect(members).toEqual([
    expect.objectContaining({ organization_id: second.data.activeOrganizationId, role: 'owner' }),
  ]);
});

test('a mint interrupted between its two writes is finished by the next session', async () => {
  const { adapter, createUser, db, hook } = await setup();
  const user = await createUser('retry');
  const orphan = await adapter.create({
    model: 'organization',
    data: { name: 'retry', slug: `org-${user.id}`, mintPending: true, createdAt: new Date() },
  });
  const result = await hook({ userId: user.id });
  expect(result.data.activeOrganizationId).toBe(orphan.id);
  const { organizations, members } = await stateOf({ db, userId: user.id });
  expect(organizations).toEqual([expect.objectContaining({ mint_pending: false })]);
  expect(members).toEqual([expect.objectContaining({ role: 'owner' })]);
});

test('the first mint leaves the unique indexes in place', async () => {
  const { createUser, db, hook } = await setup();
  const user = await createUser('indexes');
  await hook({ userId: user.id });
  const unique = async (name) =>
    (await db.collection(name).indexes())
      .filter((index) => index.unique === true)
      .map((index) => index.key);
  expect(await unique('user-organizations')).toEqual([{ slug: 1 }]);
  expect(await unique('user-members')).toEqual([{ user_id: 1, organization_id: 1 }]);
});
