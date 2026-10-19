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

// The member token model against a real BetterAuth instance and the real
// MongoDB auth adapter (pnpm test:mongodb): the collection and column names the
// modules read natively, and the unique index on the hash.

import { createHash, randomUUID } from 'node:crypto';
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
const { default: buildMcpTokenPlugin } = await import('./buildMcpTokenPlugin.js');
const { default: ensureMcpTokenIndexes } = await import('./ensureMcpTokenIndexes.js');
const { default: buildOrganizationPlugin } = await import(
  './organizations/buildOrganizationPlugin.js'
);
const { default: resolveAuthentication } = await import('../../context/resolveAuthentication.js');

let client;

beforeAll(async () => {
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  await Promise.all([client, ...clients].map((each) => each.close()));
});

test('member tokens are stored in user-mcp-tokens with snake_case columns and a unique hash', async () => {
  const database = 'mcpTokenModel';
  const auth = betterAuth({
    baseURL: 'http://localhost:3261',
    secret: 'mcp-token-model-test-secret-0123456789abcdef',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    advanced: { database: { generateId: () => randomUUID() } },
    plugins: [buildMcpTokenPlugin()],
  });
  const logger = { error: jest.fn(), warn: jest.fn() };
  await ensureMcpTokenIndexes({ auth, logger });
  expect(logger.error).not.toHaveBeenCalled();

  const { adapter } = await auth.$context;
  const createdAt = new Date('2026-01-01T00:00:00Z');
  const created = await adapter.create({
    model: 'mcpToken',
    data: {
      organizationId: 'org_1',
      userId: 'user_1',
      memberId: 'member_1',
      name: 'nightly worker',
      hash: 'hash_1',
      start: 'ldf_mcp_abcd',
      createdAt,
      expiresAt: null,
      lastUsedAt: null,
    },
  });

  const found = await adapter.findOne({
    model: 'mcpToken',
    where: [{ field: 'hash', value: 'hash_1' }],
  });
  expect(found).toMatchObject({
    id: created.id,
    organizationId: 'org_1',
    memberId: 'member_1',
    createdAt,
    expiresAt: null,
  });

  const db = client.db(database);
  const stored = await db.collection('user-mcp-tokens').findOne({ hash: 'hash_1' });
  expect(stored).toMatchObject({
    organization_id: 'org_1',
    user_id: 'user_1',
    member_id: 'member_1',
    created_at: createdAt,
    expires_at: null,
  });

  const indexes = await db.collection('user-mcp-tokens').indexes();
  expect(indexes).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: { hash: 1 }, unique: true })])
  );
});

test('a member token resolves its member through the real adapter and records lastUsedAt', async () => {
  const database = 'mcpTokenResolve';
  let auth;
  auth = betterAuth({
    baseURL: 'http://localhost:3261',
    secret: 'mcp-token-model-test-secret-0123456789abcdef',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    advanced: { database: { generateId: () => randomUUID() } },
    plugins: [buildOrganizationPlugin({ getAuth: () => auth }), buildMcpTokenPlugin()],
  });
  const { adapter, internalAdapter } = await auth.$context;
  const user = await internalAdapter.createUser({
    email: 'worker@example.com',
    name: 'worker',
    emailVerified: true,
  });
  const member = await adapter.create({
    model: 'member',
    data: {
      organizationId: 'org_1',
      userId: user.id,
      role: 'member',
      appRoles: ['builder'],
      createdAt: new Date(),
    },
  });
  const token = `ldf_mcp_${'b'.repeat(43)}`;
  await adapter.create({
    model: 'mcpToken',
    data: {
      organizationId: 'org_1',
      userId: user.id,
      memberId: member.id,
      name: 'build-01',
      hash: createHash('sha256').update(token).digest('hex'),
      start: token.slice(0, 12),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      lastUsedAt: null,
    },
  });

  const context = { config: {}, logger: { debug: jest.fn(), warn: jest.fn() } };
  await resolveAuthentication(context, {
    auth,
    headers: new Headers({ authorization: `Bearer ${token}` }),
    mcp: true,
  });

  expect(context.mcpAuth).toMatchObject({ tokenStatus: 'valid', organizationId: 'org_1' });
  expect(context.user).toMatchObject({
    id: user.id,
    roles: ['builder'],
    organization_id: 'org_1',
    auth_method: 'mcp',
  });
  const stored = await client
    .db(database)
    .collection('user-mcp-tokens')
    .findOne({ name: 'build-01' });
  expect(stored.last_used_at).toBeInstanceOf(Date);
  expect(context.logger.warn).not.toHaveBeenCalled();
});
