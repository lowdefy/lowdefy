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
import MongoDBDeleteOne from './MongoDBDeleteOne.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBDeleteOne.meta;
const schema = MongoDBDeleteOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'deleteOne';
const documents = [{ _id: 'deleteOne' }, { _id: 'deleteOne_log' }];

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('deleteOne', async () => {
  const request = {
    filter: { _id: 'deleteOne' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBDeleteOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    deletedCount: 1,
  });
});

test('deleteOne connection error', async () => {
  const request = {
    filter: { _id: 'test' },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBDeleteOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('deleteOne catch invalid options', async () => {
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
  const res = await MongoDBDeleteOne({ request, connection });
  expect(res).toEqual({
    acknowledged: false,
    deletedCount: 0,
  });
});

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteOne request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteOne request should have required property "filter".'
  );
});

test('request filter not an object', async () => {
  const request = { filter: 'filter' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteOne request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { filter: { _id: 'test' }, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBDeleteOne request property "options" should be an object.'
  );
});
