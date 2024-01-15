/*
  Copyright 2020-2024 Lowdefy, Inc

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
import MongoDBFindOne from './MongoDBFindOne.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBFindOne.meta;
const schema = MongoDBFindOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'findOne';
const documents = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('findOne', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await MongoDBFindOne({ request, connection });
  expect(res).toEqual({
    _id: 1,
  });
});

test('findOne only find one', async () => {
  const request = {
    query: { _id: { $gt: 1 } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await MongoDBFindOne({ request, connection });
  expect(res).toEqual({
    _id: 2,
  });
});

test('find options', async () => {
  const request = {
    query: { _id: { $gt: 1 } },
    options: { sort: [['id', -1]] },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  const res = await MongoDBFindOne({ request, connection });
  expect(res).toEqual({
    _id: 2,
  });
});

test('findOne connection error', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(MongoDBFindOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('findOne mongodb error', async () => {
  const request = { query: { x: { $badOp: 1 } } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(MongoDBFindOne({ request, connection })).rejects.toThrow('unknown operator: $badOp');
});

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBFindOne request properties should be an object.'
  );
});

test('request no query', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBFindOne request should have required property "query".'
  );
});

test('request query not an object', async () => {
  const request = { query: 'query' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBFindOne request property "query" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { query: { _id: 'test' }, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBFindOne request property "options" should be an object.'
  );
});
