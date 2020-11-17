/*
  Copyright 2020 Lowdefy, Inc

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

import MongoDBDeleteMany from './MongoDBDeleteMany';
import populateTestMongoDb from '../../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../../context/errors';
import { testSchema } from '../../../controllers/requestController';

const { resolver, schema } = MongoDBDeleteMany;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'deleteMany';
const documents = [
  { _id: 'deleteMany' },
  { _id: 'deleteMany_1' },
  { _id: 'deleteMany_2' },
  { _id: 'deleteMany_3' },
  { _id: 'deleteMany_4', f: 'deleteMany' },
  { _id: 'deleteMany_5', f: 'deleteMany' },
  { _id: 'deleteMany_6', f: 'deleteMany' },
];

const context = { ConfigurationError, RequestError };

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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 1,
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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 3,
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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 3,
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
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('deleteMany mongodb error', async () => {
  const request = {
    filter: { _id: 'test' },
    options: { w: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoError: w has to be a number or a string'
  );
});

test('deleteMany write false', async () => {
  const request = { filter: { _id: 'test' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(resolver({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoDBCollection connection does not allow writes'
  );
});

test('deleteMany write not specified', async () => {
  const request = {
    filter: { _id: 'test' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(resolver({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoDBCollection connection does not allow writes.'
  );
});

test('request not an object', async () => {
  const request = 'request';
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBDeleteMany request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = {};
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBDeleteMany request should have required property "filter".'
  );
});

test('request filter not an object', async () => {
  const request = { filter: 'filter' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBDeleteMany request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { filter: { _id: 'test' }, options: 'options' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBDeleteMany request property "options" should be an object.'
  );
});
