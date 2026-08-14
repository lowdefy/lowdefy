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
import MongoDBUpdateOne from './MongoDBUpdateOne.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBUpdateOne.meta;
const schema = MongoDBUpdateOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateOne';
const logCollection = 'logCollection';
const documents = [
  { _id: 'updateOne', v: 'before' },
  { _id: null, v: 'sentinel' },
];

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('updateOne', async () => {
  const request = {
    filter: { _id: 'updateOne' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
});

test('updateOne logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne' },
    update: { $set: { v: 'afterLog' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne',
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
    requestId: 'updateOne',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne',
    before: { _id: 'updateOne', v: 'after' },
    after: { _id: 'updateOne', v: 'afterLog' },
    type: 'MongoDBUpdateOne',
    meta: { meta: true },
  });
});

test('updateOne upsert', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 0,
    upsertedId: 'updateOne_upsert',
    upsertedCount: 1,
    matchedCount: 0,
  });
});

test('updateOne upsert logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_log' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne_upsert_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: 'updateOne_upsert_log',
    upsertedCount: 1,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateOne_upsert_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne_upsert_log',
    before: null,
    after: { _id: 'updateOne_upsert_log', v: 'after' },
    type: 'MongoDBUpdateOne',
    meta: { meta: true },
  });
});

test('updateOne upsert false', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { upsert: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  expect(async () => {
    await MongoDBUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateOne upsert false logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { upsert: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  await expect(async () => {
    await MongoDBUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'updateOne_upsert_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateOne_upsert_false',
  });
  expect(logged).toBeNull();
});

test('updateOne upsert default false', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_default_false' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  expect(async () => {
    await MongoDBUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateOne upsert default false logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne_upsert_default_false' },
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
    await MongoDBUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'updateOne_upsert_default_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateOne_upsert_default_false',
  });
  expect(logged).toBeNull();
});

test('updateOne disableNoMatchError', async () => {
  const request = {
    filter: { _id: 'updateOne_disable_no_match_error' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: true,
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBUpdateOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateOne disableNoMatchError logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne_disable_no_match_error' },
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
  const res = await MongoDBUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne_disable_no_match_error',
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
    requestId: 'updateOne_disable_no_match_error',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne_disable_no_match_error',
    before: null,
    after: null,
    type: 'MongoDBUpdateOne',
    meta: { meta: true },
  });
});

test('updateOne disableNoMatchError false', async () => {
  const request = {
    filter: { _id: 'updateOne_disable_no_match_error_false' },
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
    await MongoDBUpdateOne({ request, connection });
  }).rejects.toThrow('No matching record to update.');
});

test('updateOne disableNoMatchError false logCollection', async () => {
  const request = {
    filter: { _id: 'updateOne_disable_no_match_error_false' },
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
    await MongoDBUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: 'updateOne_disable_no_match_error_false',
      connection,
    });
  }).rejects.toThrow('No matching record to update.');
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'updateOne_disable_no_match_error_false',
  });
  expect(logged).toBeNull();
});

test('updateOne no-match logCollection does not pick up _id:null doc as after', async () => {
  const request = {
    filter: { _id: 'updateOne_no_match_id_null_regression' },
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
  const res = await MongoDBUpdateOne({
    request,
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'updateOne_no_match_id_null_regression',
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
    requestId: 'updateOne_no_match_id_null_regression',
  });
  expect(logged.before).toBeNull();
  expect(logged.after).toBeNull();
});

test('updateOne response shape is invariant to logCollection', async () => {
  const baseConnection = { databaseUri, databaseName, collection, write: true };
  const logConnection = {
    ...baseConnection,
    changeLog: { collection: logCollection, meta: { meta: true } },
  };

  const match = {
    filter: { _id: 'updateOne_invariance_match' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const upsert = {
    filter: { _id: 'updateOne_invariance_upsert' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const noMatch = {
    filter: { _id: 'updateOne_invariance_no_match' },
    update: { $set: { v: 'after' } },
    disableNoMatchError: true,
  };

  // Pre-seed the match doc so the matched-case response is identical in both branches.
  await MongoDBUpdateOne({ request: match, connection: baseConnection });

  const expectedKeys = ['acknowledged', 'matchedCount', 'modifiedCount', 'upsertedCount', 'upsertedId'];
  for (const request of [match, upsert, noMatch]) {
    const resNoLog = await MongoDBUpdateOne({ request, connection: baseConnection });
    const resWithLog = await MongoDBUpdateOne({
      request,
      blockId: 'blockId',
      connectionId: 'connectionId',
      pageId: 'pageId',
      payload: { payload: true },
      requestId: `invariance_${request.filter._id}`,
      connection: logConnection,
    });
    expect(Object.keys(resNoLog).sort()).toEqual(expectedKeys);
    expect(Object.keys(resWithLog).sort()).toEqual(expectedKeys);
  }
});

test('updateOne connection error', async () => {
  const request = {
    filter: { _id: 'updateOne_connection_error' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBUpdateOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('updateOne mongodb error', async () => {
  const request = {
    filter: { _id: 'updateOne_mongodb_error' },
    update: { $badOp: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBUpdateOne({ request, connection })).rejects.toThrow(
    'Unknown modifier: $badOp'
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
    'MongoDBUpdateOne request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = { update: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBUpdateOne request should have required property "filter".'
  );
});

test('request no update', async () => {
  const request = { filter: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBUpdateOne request should have required property "update".'
  );
});

test('request update not an object', async () => {
  const request = { update: 'update', filter: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBUpdateOne request property "update" should be an object.'
  );
});

test('request filter not an object', async () => {
  const request = { update: {}, filter: 'filter' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBUpdateOne request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { update: {}, filter: {}, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBUpdateOne request property "options" should be an object.'
  );
});
