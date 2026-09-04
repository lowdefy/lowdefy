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
import MongoDBInsertMany from './MongoDBInsertMany.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBInsertMany.meta;
const schema = MongoDBInsertMany.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertMany';
const logCollection = 'logCollection';

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

test('insertMany', async () => {
  const request = {
    docs: [{ _id: 'insertMany1-1' }, { _id: 'insertMany1-2' }, { _id: 'insertMany1-3' }],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertMany({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedCount: 3,
    insertedIds: { 0: 'insertMany1-1', 1: 'insertMany1-2', 2: 'insertMany1-3' },
  });
});

test('insertMany logCollection', async () => {
  const request = {
    docs: [
      { _id: 'insertMany1-1_log' },
      { _id: 'insertMany1-2_log' },
      { _id: 'insertMany1-3_log' },
    ],
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBInsertMany({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertMany_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedCount: 3,
    insertedIds: { 0: 'insertMany1-1_log', 1: 'insertMany1-2_log', 2: 'insertMany1-3_log' },
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertMany_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertMany_log',
    type: 'MongoDBInsertMany',
    meta: { meta: true },
  });
});

test('insertMany options', async () => {
  const request = {
    docs: [{ _id: 'insertMany2-1' }, { _id: 'insertMany2-2' }],
    options: { writeConcern: { w: 'majority' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertMany({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedCount: 2,
    insertedIds: { 0: 'insertMany2-1', 1: 'insertMany2-2' },
  });
});

test('insertMany logCollection options', async () => {
  const request = {
    docs: [{ _id: 'insertMany2-1_log' }, { _id: 'insertMany2-2_log' }],
    options: { writeConcern: { w: 'majority' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBInsertMany({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertMany_options_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedCount: 2,
    insertedIds: { 0: 'insertMany2-1_log', 1: 'insertMany2-2_log' },
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertMany_options_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertMany_options_log',
    type: 'MongoDBInsertMany',
    meta: { meta: true },
  });
});

test('insertMany connection error', async () => {
  const request = { docs: [{ _id: 'insertMany8-1' }, { _id: 'insertMany8-2' }] };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBInsertMany({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('insertMany mongodb error', async () => {
  const request = { docs: [{ _id: 'insertMany9-1' }, { _id: 'insertMany9-2' }] };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await MongoDBInsertMany({ request, connection });
  await expect(MongoDBInsertMany({ request, connection })).rejects.toThrow(
    'Duplicate key on collection "insertMany"'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertMany request properties should be an object.'
  );
});

test('request no docs', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertMany request should have required property "docs".'
  );
});

test('request docs not an array', async () => {
  const request = { docs: 'docs' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertMany request property "docs" should be an array.'
  );
});

test('request docs not an array of objects', async () => {
  const request = { docs: [1, 2, 3] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertMany request property "docs" should be an array of documents to insert.'
  );
});

test('request options not an object', async () => {
  const request = { docs: [], options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertMany request property "options" should be an object.'
  );
});

// Write validation against build/collections.json fields (collectionSchema).
const collectionSchema = {
  name: 'answers',
  fields: {
    test_id: { type: 'string' },
    result: { enum: ['pass', 'fail', 'partial', 'na'] },
    created_at: { type: 'string', format: 'date-time' },
  },
};

test('insertMany with a collectionSchema throws for a violating document and writes nothing', async () => {
  const violationCollection = 'insertManyContractViolation';
  await clearTestMongoDb({ collection: violationCollection });
  const connection = { databaseUri, databaseName, collection: violationCollection, write: true };
  await expect(
    MongoDBInsertMany({
      request: {
        docs: [
          { _id: 'v1', test_id: 't1', result: 'pass' },
          { _id: 'v2', test_id: 2, result: 'pass' },
        ],
      },
      connection,
      collectionSchema,
    })
  ).rejects.toThrow(
    'Field "test_id" in an insert document (docs[1]) for collection "answers" does not match the declared contract: must be string. Received 2.'
  );
  const client = new MongoClient(databaseUri);
  await client.connect();
  const written = await client.db().collection(violationCollection).find({}).toArray();
  await client.close();
  expect(written).toEqual([]);
});

test('insertMany with a collectionSchema writes conforming documents', async () => {
  const okCollection = 'insertManyContractOk';
  await clearTestMongoDb({ collection: okCollection });
  const connection = { databaseUri, databaseName, collection: okCollection, write: true };
  const res = await MongoDBInsertMany({
    request: {
      docs: [
        { _id: 'ok1', test_id: 't1', result: 'pass', extra: true },
        { _id: 'ok2', test_id: 't2', created_at: { '~d': '2026-01-01T00:00:00.000Z' } },
      ],
    },
    connection,
    collectionSchema,
  });
  expect(res.insertedCount).toEqual(2);
});
