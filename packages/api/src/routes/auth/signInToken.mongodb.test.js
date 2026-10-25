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

// Sign-in tokens against a real BetterAuth instance and the real MongoDB auth
// adapter (pnpm test:mongodb): the stored columns, the unique index on the hash,
// and that the spend is atomic - of many exchanges of one token fired at once,
// exactly one opens a session.

import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import * as mongodb from 'mongodb';

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
const { CreateSignInToken } = await import('@lowdefy/plugin-better-auth/steps');
const { default: buildSignInTokenPlugin } = await import('./buildSignInTokenPlugin.js');
const { default: ensureSignInTokenIndexes } = await import('./ensureSignInTokenIndexes.js');
const { default: buildOrganizationPlugin } = await import(
  './organizations/buildOrganizationPlugin.js'
);

const ORIGIN = 'http://localhost:3261';
let client;

beforeAll(async () => {
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  await Promise.all([client, ...clients].map((each) => each.close()));
});

test('a sign-in token is stored hashed, and of many concurrent exchanges exactly one succeeds', async () => {
  const database = 'signInTokenSpend';
  const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };
  let auth;
  auth = betterAuth({
    baseURL: ORIGIN,
    secret: 'sign-in-token-test-secret-0123456789abcdef',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    rateLimit: { enabled: false },
    advanced: { database: { generateId: () => randomUUID() } },
    plugins: [
      buildOrganizationPlugin({ getAuth: () => auth }),
      buildSignInTokenPlugin({ getAuth: () => auth, logger, scopes: ['email-link'] }),
    ],
  });
  await ensureSignInTokenIndexes({ auth, logger });
  expect(logger.error).not.toHaveBeenCalled();

  const { adapter, internalAdapter } = await auth.$context;
  const user = await internalAdapter.createUser({
    email: 'person@example.com',
    name: 'person',
    emailVerified: true,
  });
  const member = await adapter.create({
    model: 'member',
    data: { organizationId: 'org_1', userId: user.id, role: 'member', createdAt: new Date() },
  });

  const { token } = await CreateSignInToken({
    acting: { system: true, user: null },
    auth,
    markCredential: jest.fn(),
    properties: {
      userId: user.id,
      organizationId: 'org_1',
      scope: 'email-link',
      landing: { url: '/task?id=task-1' },
    },
  });

  const db = client.db(database);
  const stored = await db.collection('user-sign-in-tokens').findOne({});
  expect(JSON.stringify(stored)).not.toContain(token);
  expect(stored).toMatchObject({
    organization_id: 'org_1',
    user_id: user.id,
    member_id: member.id,
    scope: 'email-link',
    state: 'issued',
  });
  const indexes = await db.collection('user-sign-in-tokens').indexes();
  expect(indexes).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: { hash: 1 }, unique: true })])
  );

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      auth.handler(
        new Request(`${ORIGIN}/api/auth/sign-in-token/exchange`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: ORIGIN },
          body: JSON.stringify({ token }),
        })
      )
    )
  );
  const statuses = responses.map((response) => response.status);
  expect(statuses.filter((status) => status === 200)).toHaveLength(1);
  expect(statuses.filter((status) => status === 401)).toHaveLength(9);
  const sessions = await adapter.findMany({ model: 'session' });
  expect(sessions.map((session) => session.sessionScope)).toEqual(['email-link']);
  expect(await db.collection('user-sign-in-tokens').findOne({})).toMatchObject({ state: 'spent' });
});
