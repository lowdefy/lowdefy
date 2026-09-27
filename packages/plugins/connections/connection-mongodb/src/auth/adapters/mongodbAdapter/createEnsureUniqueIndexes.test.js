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

// ensureUniqueIndexes against the real server, through an adapter BetterAuth
// constructs the way the engine does: model and logical field names in, the
// physical collections and snake_case fields out.

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
const { organization } = await import('better-auth/plugins');
const { default: MongoDBAuthAdapter } = await import('../MongoDBAuthAdapter/MongoDBAuthAdapter.js');

const indexes = [
  { model: 'organization', fields: ['slug'] },
  { model: 'member', fields: ['userId', 'organizationId'] },
];

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
  const database = `ensureUniqueIndexes${run}`;
  const auth = betterAuth({
    baseURL: 'http://localhost:3260',
    secret: 'ensure-unique-indexes-test-secret-0123456789',
    database: MongoDBAuthAdapter({ properties: { uri: process.env.MONGO_URL, database } }),
    logger: { disabled: true },
    plugins: [
      organization({
        schema: {
          organization: { modelName: 'user-organizations' },
          member: { modelName: 'user-members' },
        },
      }),
    ],
  });
  const { adapter } = await auth.$context;
  return { adapter, db: client.db(database) };
}

async function uniqueIndexKeys(collection) {
  const all = await collection.indexes();
  return all.filter((index) => index.unique === true).map((index) => index.key);
}

test('ensureUniqueIndexes creates the unique indexes on the physical collections and fields', async () => {
  const { adapter, db } = await setup();
  await adapter.options.ensureUniqueIndexes({ indexes });
  expect(await uniqueIndexKeys(db.collection('user-organizations'))).toEqual([{ slug: 1 }]);
  expect(await uniqueIndexKeys(db.collection('user-members'))).toEqual([
    { user_id: 1, organization_id: 1 },
  ]);
});

test('ensureUniqueIndexes is idempotent', async () => {
  const { adapter, db } = await setup();
  await adapter.options.ensureUniqueIndexes({ indexes });
  await adapter.options.ensureUniqueIndexes({ indexes });
  expect(await db.collection('user-members').indexes()).toHaveLength(2);
});

test('ensureUniqueIndexes accepts an equivalent unique index created under another name', async () => {
  const { adapter, db } = await setup();
  await db
    .collection('user-members')
    .createIndex({ organization_id: 1, user_id: -1 }, { unique: true, name: 'by_hand' });
  await adapter.options.ensureUniqueIndexes({ indexes });
  const names = (await db.collection('user-members').indexes()).map((index) => index.name);
  expect(names.sort()).toEqual(['_id_', 'by_hand']);
});

test('ensureUniqueIndexes names the collection when existing duplicates block the index', async () => {
  const { adapter, db } = await setup();
  await db.collection('user-members').insertMany([
    { user_id: 'u1', organization_id: 'o1', role: 'owner' },
    { user_id: 'u1', organization_id: 'o1', role: 'owner' },
  ]);
  const ensure = adapter.options.ensureUniqueIndexes({ indexes });
  await expect(ensure).rejects.toThrow(
    'Could not create the unique index on collection "user-members" over ["user_id","organization_id"]'
  );
  await expect(ensure).rejects.toThrow('E11000 duplicate key error');
});

test('after ensureUniqueIndexes, concurrent writes of the same member row store exactly one', async () => {
  const { adapter, db } = await setup();
  await adapter.options.ensureUniqueIndexes({ indexes });
  const writes = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      adapter.create({
        model: 'member',
        data: { userId: 'u1', organizationId: 'o1', role: 'owner', createdAt: new Date() },
      })
    )
  );
  expect(writes.filter((write) => write.status === 'fulfilled')).toHaveLength(1);
  expect(await db.collection('user-members').countDocuments()).toBe(1);
});
