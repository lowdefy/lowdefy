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

import { validate } from '@lowdefy/ajv';
import { MongoClient } from 'mongodb';

import MongoDBCreateIndexes from './MongoDBCreateIndexes.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBCreateIndexes.meta;
const schema = MongoDBCreateIndexes.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'createIndexes';

const connection = { databaseUri, databaseName, collection, write: true };

async function listIndexes() {
  const client = new MongoClient(databaseUri);
  await client.connect();
  const indexes = await client.db(databaseName).collection(collection).indexes();
  await client.close();
  return indexes;
}

beforeAll(() => {
  return populateTestMongoDb({ collection, documents: [{ _id: 'createIndexes_1', f: 1 }] });
});

test('createIndexes creates a declared index and returns its name', async () => {
  const request = { indexes: [{ keys: { organization_id: 1, due: -1 } }] };
  const res = await MongoDBCreateIndexes({ request, connection });
  expect(res).toEqual({ indexNames: ['organization_id_1_due_-1'] });
  const indexes = await listIndexes();
  expect(indexes.map((index) => index.name)).toContain('organization_id_1_due_-1');
});

test('createIndexes passes options through, so a unique index is unique', async () => {
  const request = {
    indexes: [{ keys: { external_ref: 1 }, options: { unique: true, name: 'by_external_ref' } }],
  };
  const res = await MongoDBCreateIndexes({ request, connection });
  expect(res).toEqual({ indexNames: ['by_external_ref'] });
  const indexes = await listIndexes();
  expect(indexes.find((index) => index.name === 'by_external_ref').unique).toBe(true);
});

test('createIndexes creates more than one index in one request', async () => {
  const request = {
    indexes: [{ keys: { status: 1 } }, { keys: { assignee: 1, status: 1 } }],
  };
  const res = await MongoDBCreateIndexes({ request, connection });
  expect(res).toEqual({ indexNames: ['status_1', 'assignee_1_status_1'] });
});

test('createIndexes is idempotent, so a migration may re-run', async () => {
  const request = { indexes: [{ keys: { retry_key: 1 } }] };
  const first = await MongoDBCreateIndexes({ request, connection });
  const second = await MongoDBCreateIndexes({ request, connection });
  expect(second).toEqual(first);
  const indexes = await listIndexes();
  expect(indexes.filter((index) => index.name === 'retry_key_1')).toHaveLength(1);
});

test('createIndexes records the specifications it sent on the trace', async () => {
  const trace = {};
  await MongoDBCreateIndexes({
    request: { indexes: [{ keys: { traced: 1 }, options: { name: 'traced' } }] },
    connection,
    trace,
  });
  expect(trace.effective).toEqual({ indexes: [{ key: { traced: 1 }, name: 'traced' }] });
});

test('createIndexes maps a driver error, so a conflicting index is reported', async () => {
  await MongoDBCreateIndexes({
    request: { indexes: [{ keys: { conflict: 1 }, options: { name: 'conflict' } }] },
    connection,
  });
  await expect(
    MongoDBCreateIndexes({
      request: { indexes: [{ keys: { conflict: -1 }, options: { name: 'conflict' } }] },
      connection,
    })
  ).rejects.toThrow();
});

test('createIndexes does not offer a drop', () => {
  expect(Object.keys(MongoDBCreateIndexes.schema.properties)).toEqual(['indexes']);
});

test('valid request schema', () => {
  const request = { indexes: [{ keys: { a: 1 }, options: { unique: true } }] };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request should have required property "indexes"', () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBCreateIndexes request should have required property "indexes".'
  );
});

test('request property "indexes" should not be empty', () => {
  const request = { indexes: [] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBCreateIndexes request property "indexes" should not be empty.'
  );
});

test('request property "indexes" entries should have "keys"', () => {
  const request = { indexes: [{ options: { unique: true } }] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBCreateIndexes request property "indexes" entries should have required property "keys".'
  );
});

test('checkRead should be false', () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', () => {
  expect(checkWrite).toBe(true);
});
