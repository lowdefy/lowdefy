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
import MongoDBInsertOne from './MongoDBInsertOne.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBInsertOne.meta;
const schema = MongoDBInsertOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertOne';
const logCollection = 'logCollection';

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

test('insertOne', async () => {
  const request = { doc: { _id: 'insertOne' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne',
  });
});

test('insertOne logCollection', async () => {
  const request = { doc: { _id: 'insertOne_log' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBInsertOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertOne_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne_log',
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertOne_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertOne_log',
    type: 'MongoDBInsertOne',
    meta: { meta: true },
  });
});

test('insertOne options', async () => {
  const request = {
    doc: { _id: 'insertOne_options' },
    options: { writeConcern: { w: 'majority' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne_options',
  });
});

test('insertOne logCollection options', async () => {
  const request = {
    doc: { _id: 'insertOne_options_log' },
    options: { writeConcern: { w: 'majority' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBInsertOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertOne_options_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne_options_log',
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertOne_options_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertOne_options_log',
    type: 'MongoDBInsertOne',
    meta: { meta: true },
  });
});

test('insertOne connection error', async () => {
  const request = { doc: { _id: 'insertOne_connection_error' } };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBInsertOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('insertOne mongodb error', async () => {
  const request = { doc: { _id: 'insertOne_mongodb_error' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await MongoDBInsertOne({ request, connection });
  await expect(MongoDBInsertOne({ request, connection })).rejects.toThrow(
    'MongoDB: Duplicate key on collection "insertOne".'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('insertOne insert a date', async () => {
  const request = {
    doc: {
      _id: 'insertOneDate',
      date: new Date('2020-01-01'),
    },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOneDate',
  });
  let client;
  let inserted;
  try {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db();
    inserted = await db.collection(collection).findOne({ _id: 'insertOneDate' });
    await client.close();
  } catch (error) {
    await client.close();
  }
  expect(inserted).toEqual({
    _id: 'insertOneDate',
    date: new Date('2020-01-01'),
  });
});

test('insertOne throws a ServiceError with a hint when a unique index is violated', async () => {
  const uniqueCollection = 'insertOneUniqueIndex';
  const client = new MongoClient(databaseUri);
  await client.connect();
  try {
    await client
      .db(databaseName)
      .collection(uniqueCollection)
      .createIndex({ ref: 1 }, { unique: true });
  } finally {
    await client.close();
  }
  const connection = {
    databaseUri,
    databaseName,
    collection: uniqueCollection,
    write: true,
  };
  await MongoDBInsertOne({ request: { doc: { ref: 'ORD-1' } }, connection });
  await expect(
    MongoDBInsertOne({ request: { doc: { ref: 'ORD-1' } }, connection })
  ).rejects.toThrow('MongoDB: Duplicate key on collection "insertOneUniqueIndex".');
  const error = await MongoDBInsertOne({
    request: { doc: { ref: 'ORD-1' } },
    connection,
  }).catch((e) => e);
  expect(error.name).toBe('ServiceError');
  expect(error.code).toBe(11000);
  expect(error.hint).toBe(
    'A unique index on ref already has a document with these values. Insert with MongoDBUpdateOne and upsert: true, or remove the existing document first.'
  );
  expect(error.message).not.toContain('ORD-1');
  expect(error.cause.name).toBe('MongoServerError');
});

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request properties should be an object.'
  );
});

test('request no doc', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request should have required property "doc".'
  );
});

test('request doc not an object', async () => {
  const request = { doc: 'doc' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request property "doc" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { doc: {}, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request property "options" should be an object.'
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

test('insertOne with a collectionSchema throws a contract violation before touching the database', async () => {
  const violationCollection = 'insertOneContractViolation';
  await clearTestMongoDb({ collection: violationCollection });
  const connection = { databaseUri, databaseName, collection: violationCollection, write: true };
  await expect(
    MongoDBInsertOne({
      request: { doc: { _id: 'v1', test_id: 't1', result: 'Pass' } },
      connection,
      collectionSchema,
    })
  ).rejects.toThrow(
    'Field "result" in an insert document for collection "answers" does not match the declared contract: must be equal to one of the allowed values (pass, fail, partial, na). Received "Pass".'
  );
  const client = new MongoClient(databaseUri);
  await client.connect();
  const written = await client.db().collection(violationCollection).find({}).toArray();
  await client.close();
  expect(written).toEqual([]);
});

test('insertOne with a collectionSchema writes a conforming document with undeclared fields and a serialized date', async () => {
  const okCollection = 'insertOneContractOk';
  await clearTestMongoDb({ collection: okCollection });
  const connection = { databaseUri, databaseName, collection: okCollection, write: true };
  const res = await MongoDBInsertOne({
    request: {
      doc: {
        _id: 'ok1',
        test_id: 't1',
        result: 'pass',
        reviewed_by: 'u1',
        created_at: { '~d': '2026-01-01T00:00:00.000Z' },
      },
    },
    connection,
    collectionSchema,
  });
  expect(res).toEqual({ acknowledged: true, insertedId: 'ok1' });
  const client = new MongoClient(databaseUri);
  await client.connect();
  const written = await client.db().collection(okCollection).findOne({ _id: 'ok1' });
  await client.close();
  expect(written.created_at).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  expect(written.reviewed_by).toEqual('u1');
});

test('insertOne validates after the tenant stamp so a required tenant field passes', async () => {
  const tenantCollection = 'insertOneContractTenant';
  await clearTestMongoDb({ collection: tenantCollection });
  const connection = { databaseUri, databaseName, collection: tenantCollection, write: true };
  const res = await MongoDBInsertOne({
    request: { doc: { _id: 'tn1', test_id: 't1' } },
    connection,
    tenant: { field: 'organization_id', value: 'org_a' },
    collectionSchema: {
      name: 'answers',
      fields: { organization_id: { type: 'string' } },
      required: ['organization_id'],
    },
  });
  expect(res).toEqual({ acknowledged: true, insertedId: 'tn1' });
});

test('insertOne with a null collectionSchema does not validate', async () => {
  const nullCollection = 'insertOneContractNull';
  await clearTestMongoDb({ collection: nullCollection });
  const connection = { databaseUri, databaseName, collection: nullCollection, write: true };
  const res = await MongoDBInsertOne({
    request: { doc: { _id: 'n1', result: 'Pass' } },
    connection,
    collectionSchema: null,
  });
  expect(res).toEqual({ acknowledged: true, insertedId: 'n1' });
});
