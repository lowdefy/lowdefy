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
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';
import getTestCollection from '../../../../test/getTestCollection.js';

const { checkRead, checkWrite } = MongoDBVersionedUpdateOne.meta;
const schema = MongoDBVersionedUpdateOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateInsertOne';
const logCollection = 'logCollection';
const documents = [{ _id: 'uniqueId', v: 'before', doc_id: 'updateInsertOne' }];

beforeEach(() => {
  return populateTestMongoDb({ collection, documents });
});

test('updateInsertOne', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
});

test('updateInsertOne logCollection', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne' },
    update: { $set: { v: 'afterLog' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOne',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateInsertOne',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOne',
    before: { doc_id: 'updateInsertOne', v: 'before' },
    after: { doc_id: 'updateInsertOne', v: 'afterLog' },
    type: 'MongoDBVersionedUpdateOne',
    meta: { meta: true },
  });
});

test('updateInsertOne logCollection with find options', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne' },
    update: { $set: { v: 'afterLog' } },
    options: { find: { projection: { doc_id: 0 } } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOneFindOptions',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateInsertOneFindOptions',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOneFindOptions',
    before: { v: 'before' },
    after: { v: 'afterLog' },
    type: 'MongoDBVersionedUpdateOne',
    meta: { meta: true },
  });
});

test('updateInsertOne upsert', async () => {
  const request = {
    filter: { _id: 'uniqueId_upsert', doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
    options: { update: { upsert: true } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 0,
    upsertedId: 'uniqueId_upsert',
    upsertedCount: 1,
    matchedCount: 0,
  });
});

test('updateInsertOne upsert logCollection', async () => {
  const request = {
    filter: { _id: 'uniqueId_upsert_log', doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
    options: { update: { upsert: true } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'uniqueId_upsert_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: 'uniqueId_upsert_log',
    upsertedCount: 1,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'uniqueId_upsert_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'uniqueId_upsert_log',
    before: null,
    after: { _id: 'uniqueId_upsert_log', v: 'after', doc_id: 'updateInsertOne' },
    type: 'MongoDBVersionedUpdateOne',
    meta: { meta: true },
  });
});

test('updateInsertOne upsert false', async () => {
  const request = {
    filter: { doc_id: 'uniqueId_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { update: { upsert: false } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  expect(async () => {
    await MongoDBVersionedUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateInsertOne upsert false logCollection', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { update: { upsert: false } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  await expect(async () => {
    await MongoDBVersionedUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'uniqueId_upsert_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'uniqueId_upsert_false',
  });
  expect(logged).toBeNull();
});

test('updateInsertOne upsert default false', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_upsert_default_false' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  expect(async () => {
    await MongoDBVersionedUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateInsertOne upsert default false logCollection', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_upsert_default_false' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  await expect(async () => {
    await MongoDBVersionedUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'updateInsertOne_upsert_default_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateInsertOne_upsert_default_false',
  });
  expect(logged).toBeNull();
});

test('updateInsertOne disableNoMatchError', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_disable_no_match_error' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: true,
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateInsertOne disableNoMatchError logCollection', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_disable_no_match_error' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: true,
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOne_disable_no_match_error',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateInsertOne_disable_no_match_error',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOne_disable_no_match_error',
    before: null,
    after: null,
    type: 'MongoDBVersionedUpdateOne',
    meta: { meta: true },
  });
});

test('updateInsertOne disableNoMatchError false', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_disable_no_match_error_false' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: false,
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  expect(async () => {
    await MongoDBVersionedUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateInsertOne disableNoMatchError false logCollection', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_disable_no_match_error_false' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: false,
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  await expect(async () => {
    await MongoDBVersionedUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'updateInsertOne_disable_no_match_error_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateInsertOne_disable_no_match_error_false',
  });
  expect(logged).toBeNull();
});

test('updateInsertOne response shape is invariant to logCollection', async () => {
  const baseConnection = { databaseUri, databaseName, collection, write: true };
  const logConnection = {
    ...baseConnection,
    changeLog: { collection: logCollection, meta: { meta: true } },
  };

  const match = {
    filter: { doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
  };
  const upsert = {
    filter: { _id: 'invariance_upsert', doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
    options: { update: { upsert: true } },
  };
  const noMatch = {
    filter: { doc_id: 'invariance_no_match' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: true,
  };

  const expectedKeys = ['acknowledged', 'matchedCount', 'modifiedCount', 'upsertedCount', 'upsertedId'];
  for (const request of [match, upsert, noMatch]) {
    const resNoLog = await MongoDBVersionedUpdateOne({ request, connection: baseConnection });
    const resWithLog = await MongoDBVersionedUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: `invariance_${request.filter._id ?? request.filter.doc_id}`,
      connection: logConnection,
    });
    expect(Object.keys(resNoLog).sort()).toEqual(expectedKeys);
    expect(Object.keys(resWithLog).sort()).toEqual(expectedKeys);
  }
});

test('updateInsertOne connection error', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_connection_error' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBVersionedUpdateOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('updateInsertOne mongodb error', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne_mongodb_error' },
    update: { $badOp: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBVersionedUpdateOne({ request, connection })).rejects.toThrow(
    'Unknown modifier: $badOp'
  );
});

test('updateInsertOne validate write', async () => {
  const request = {
    filter: { doc_id: 'updateInsertOne' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBVersionedUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateInsertOne_validate_write',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
  const { collection: testCollection, client } = await getTestCollection({
    collection: 'updateInsertOne',
  });
  const cursor = await testCollection.find(
    { doc_id: 'updateInsertOne' },
    { projection: { _id: 0 } }
  );
  const records = await cursor.toArray();
  expect(records).toEqual([
    { doc_id: 'updateInsertOne', v: 'before' },
    { doc_id: 'updateInsertOne', v: 'after' },
  ]);
  await client.close();
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
    'MongoDBVersionedUpdateOne request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = { update: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request should have required property "filter".'
  );
});

test('request no update', async () => {
  const request = { filter: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request should have required property "update".'
  );
});

test('request update not an object', async () => {
  const request = { update: 'update', filter: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property "update" should be an object.'
  );
});

test('request filter not an object', async () => {
  const request = { update: {}, filter: 'filter' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { update: {}, filter: {}, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property "options" should be an object.'
  );
});

test('request update options not an object', async () => {
  const request = { update: {}, filter: {}, options: { update: 'update' } };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property option "update" should be an object.'
  );
});

test('request find options not an object', async () => {
  const request = { update: {}, filter: {}, options: { find: 'find' } };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property option "find" should be an object.'
  );
});

test('request insert options not an object', async () => {
  const request = { update: {}, filter: {}, options: { insert: 'insert' } };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBVersionedUpdateOne request property option "insert" should be an object.'
  );
});
