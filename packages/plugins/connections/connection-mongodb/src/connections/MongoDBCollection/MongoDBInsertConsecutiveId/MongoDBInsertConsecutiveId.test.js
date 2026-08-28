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
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';
import findLogCollectionRecordTestMongoDb from '../../../../test/findLogCollectionRecordTestMongoDb.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBInsertConsecutiveId.meta;
const schema = MongoDBInsertConsecutiveId.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertConsecutiveId';
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

test('insertConsecutiveId assigns sequential prefixed ids', async () => {
  const first = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'first' }, prefix: 'P', length: 4 },
    connection,
  });
  expect(first).toEqual({
    acknowledged: true,
    insertedId: 'P0001',
  });
  const second = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'second' }, prefix: 'P', length: 4 },
    connection,
  });
  expect(second).toEqual({
    acknowledged: true,
    insertedId: 'P0002',
  });
});

test('insertConsecutiveId isolates ids per prefix', async () => {
  const res = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'other prefix' }, prefix: 'Q', length: 4 },
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'Q0001',
  });
});

test('insertConsecutiveId without length does not pad the id', async () => {
  const res = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'no padding' }, prefix: 'NOPAD' },
    connection,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'NOPAD1',
  });
});

test('insertConsecutiveId ignores ids with non-numeric suffixes', async () => {
  const regexCollection = 'insertConsecutiveIdRegex';
  await populateTestMongoDb({
    collection: regexCollection,
    documents: [{ _id: 'PABC' }, { _id: 'P0005' }],
  });
  const res = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'regex' }, prefix: 'P', length: 4 },
    connection: { ...connection, collection: regexCollection },
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'P0006',
  });
});

test('insertConsecutiveId logCollection', async () => {
  const res = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 'logged' }, prefix: 'LOG', length: 3 },
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertConsecutiveId_log',
    connection: {
      ...connection,
      changeLog: { collection: logCollection, meta: { meta: true } },
    },
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'LOG001',
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'insertConsecutiveId_log',
  });
  expect(logged).toMatchObject({
    blockId: 'blockId',
    connectionId: 'connectionId',
    pageId: 'pageId',
    payload: { payload: true },
    requestId: 'insertConsecutiveId_log',
    type: 'MongoDBInsertConsecutiveId',
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
    'MongoDBInsertConsecutiveId request properties should be an object.'
  );
});

test('request no doc', async () => {
  const request = { prefix: 'P' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request should have required property "doc".'
  );
});

test('request no prefix', async () => {
  const request = { doc: {} };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request should have required property "prefix".'
  );
});

test('request doc not an object', async () => {
  const request = { doc: 'doc', prefix: 'P' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request property "doc" should be an object.'
  );
});

test('request prefix not a string', async () => {
  const request = { doc: {}, prefix: 1 };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request property "prefix" should be a string.'
  );
});

test('request length not a number', async () => {
  const request = { doc: {}, prefix: 'P', length: '4' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request property "length" should be a number.'
  );
});

test('request options not an object', async () => {
  const request = { doc: {}, prefix: 'P', options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertConsecutiveId request property "options" should be an object.'
  );
});
