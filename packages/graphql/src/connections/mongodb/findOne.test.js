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

import mongodbFindOne from './findOne';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'findOne';
const documents = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];

const context = { ConfigurationError, RequestError };

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
  const res = await mongodbFindOne({ request, connection, context });
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
  const res = await mongodbFindOne({ request, connection, context });
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
  const res = await mongodbFindOne({ request, connection, context });
  expect(res).toEqual({
    _id: 2,
  });
});

test('findOne no databaseUri', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('findOne databaseUri not a string', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('findOne no databaseName (optional)', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    collection,
    read: true,
  };
  const res = await mongodbFindOne({ request, connection, context });
  expect(res).toEqual({
    _id: 1,
  });
});

test('findOne no collection', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    databaseName,
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('findOne collection not a string', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('findOne no query', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Request query not specified'
  );
});

test('findOne connection error', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    read: true,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
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
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'MongoError: unknown operator: $badOp'
  );
});

test('findOne read false', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    read: false,
  };
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbFindOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow reads'
  );
});

test('findOne read not specified', async () => {
  const request = { query: { _id: 1 } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  const res = await mongodbFindOne({ request, connection, context });
  expect(res).toEqual({
    _id: 1,
  });
});
