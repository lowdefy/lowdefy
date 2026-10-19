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
import MongoDBInsertManyConsecutiveIds from './MongoDBInsertManyConsecutiveIds.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBInsertManyConsecutiveIds.meta;
const schema = MongoDBInsertManyConsecutiveIds.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertManyConsecutiveIds';
const logCollection = 'logCollection';

const connection = {
  databaseUri,
  databaseName,
  collection,
  write: true,
};

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

test('insertManyConsecutiveIds assigns sequential prefixed ids', async () => {
  const res = await MongoDBInsertManyConsecutiveIds({
    request: {
      docs: [{ v: 'one' }, { v: 'two' }, { v: 'three' }],
      prefix: 'M',
      length: 4,
    },
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedIds: { 0: 'M0001', 1: 'M0002', 2: 'M0003' },
  });
});

test('insertManyConsecutiveIds continues from the highest existing id', async () => {
  const res = await MongoDBInsertManyConsecutiveIds({
    request: {
      docs: [{ v: 'four' }, { v: 'five' }],
      prefix: 'M',
      length: 4,
    },
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedIds: { 0: 'M0004', 1: 'M0005' },
  });
});

test('insertManyConsecutiveIds logCollection', async () => {
  const res = await MongoDBInsertManyConsecutiveIds({
    request: {
      docs: [{ v: 'logged' }],
      prefix: 'MLOG',
      length: 3,
    },
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertManyConsecutiveIds_log',
    connection: {
      ...connection,
      changeLog: { collection: logCollection, meta: { meta: true } },
    },
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedIds: { 0: 'MLOG001' },
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertManyConsecutiveIds_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertManyConsecutiveIds_log',
    type: 'MongoDBInsertManyConsecutiveIds',
    meta: { meta: true },
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
    'MongoDBInsertManyConsecutiveIds request properties should be an object.'
  );
});

test('request no docs', async () => {
  const request = { prefix: 'M' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request should have required property "docs".'
  );
});

test('request no prefix', async () => {
  const request = { docs: [] };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request should have required property "prefix".'
  );
});

test('request docs not an array', async () => {
  const request = { docs: 'docs', prefix: 'M' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request property "docs" should be an array.'
  );
});

test('request prefix not a string', async () => {
  const request = { docs: [], prefix: 1 };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request property "prefix" should be a string.'
  );
});

test('request length not a number', async () => {
  const request = { docs: [], prefix: 'M', length: '4' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request property "length" should be a number.'
  );
});

test('request options not an object', async () => {
  const request = { docs: [], prefix: 'M', options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertManyConsecutiveIds request property "options" should be an object.'
  );
});
