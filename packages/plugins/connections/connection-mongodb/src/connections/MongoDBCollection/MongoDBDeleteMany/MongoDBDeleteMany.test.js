/*
  Copyright 2020-2023 Lowdefy, Inc

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
import MongoDBDeleteMany from './MongoDBDeleteMany.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBDeleteMany.meta;
const schema = MongoDBDeleteMany.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'deleteMany';
const logCollection = 'logCollection';
const documents = [
  { _id: 'deleteMany' },
  { _id: 'deleteMany_1' },
  { _id: 'deleteMany_2' },
  { _id: 'deleteMany_3' },
  { _id: 'deleteMany_4', f: 'deleteMany' },
  { _id: 'deleteMany_5', f: 'deleteMany' },
  { _id: 'deleteMany_6', f: 'deleteMany' },
  { _id: 'deleteMany_log' },
  { _id: 'deleteMany_1_log' },
  { _id: 'deleteMany_2_log' },
  { _id: 'deleteMany_3_log' },
  { _id: 'deleteMany_4_log', f: 'deleteMany_log' },
  { _id: 'deleteMany_5_log', f: 'deleteMany_log' },
  { _id: 'deleteMany_6_log', f: 'deleteMany_log' },
];

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('deleteMany - Single Document', async () => {
  const request = {
    filter: { _id: 'deleteMany' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBDeleteMany({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 1,
  });
});

test('deleteMany logCollection - Single Document', async () => {
  const request = {
    filter: { _id: 'deleteMany_log' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBDeleteMany({
    request,
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_log',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 1,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'deleteMany_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_log',
    type: 'MongoDBDeleteMany',
    meta: { meta: true },
  });
});

test('deleteMany - Multiple Documents', async () => {
  const request = {
    filter: { _id: { $in: ['deleteMany_1', 'deleteMany_2', 'deleteMany_3'] } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBDeleteMany({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 3,
  });
});

test('deleteMany logCollection - Multiple Documents', async () => {
  const request = {
    filter: { _id: { $in: ['deleteMany_1_log', 'deleteMany_2_log', 'deleteMany_3_log'] } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBDeleteMany({
    request,
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_multiple',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 3,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'deleteMany_multiple',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_multiple',
    type: 'MongoDBDeleteMany',
    meta: { meta: true },
  });
});

test('deleteMany - Multiple Documents one field', async () => {
  const request = {
    filter: { f: 'deleteMany' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBDeleteMany({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 3,
  });
});

test('deleteMany logCollection - Multiple Documents one field', async () => {
  const request = {
    filter: { f: 'deleteMany_log' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection, meta: { meta: true } },
    write: true,
  };
  const res = await MongoDBDeleteMany({
    request,
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_multiple_one_field',
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 3,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'deleteMany_multiple_one_field',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'deleteMany_multiple_one_field',
    type: 'MongoDBDeleteMany',
    meta: { meta: true },
  });
});

test('deleteMany connection error', async () => {
  const request = {
    filter: { _id: 'test' },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBDeleteMany({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('deleteMany mongodb error', async () => {
  const request = {
    filter: { _id: 'test' },
    options: { writeConcern: { w: false } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBDeleteMany({ request, connection });
  expect(res).toEqual({
    acknowledged: false,
    deletedCount: 0,
  });
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
    'MongoDBDeleteMany request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteMany request should have required property "filter".'
  );
});

test('request filter not an object', async () => {
  const request = { filter: 'filter' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteMany request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { filter: { _id: 'test' }, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteMany request property "options" should be an object.'
  );
});
