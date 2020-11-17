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

import MongoDBUpdateOne from './MongoDBUpdateOne';
import populateTestMongoDb from '../../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../../context/errors';
import testSchema from '../../../utils/testSchema';

const { resolver, schema } = MongoDBUpdateOne;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateOne';
const documents = [{ _id: 'updateOne', v: 'before' }];

const context = { ConfigurationError, RequestError };

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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: {
      _id: 'updateOne_upsert',
      index: 0,
    },
    upsertedCount: 1,
    matchedCount: 0,
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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
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
  const res = await resolver({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
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
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
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
  await expect(resolver({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoError: Unknown modifier: $badOp'
  );
});

test('updateOne write false', async () => {
  const request = { filter: { _id: 'updateOne_write_false' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(resolver({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(resolver({ request, connection, context })).rejects.toThrow(
    'MongoDBCollection connection does not allow writes.'
  );
});

test('updateOne write not specified', async () => {
  const request = {
    filter: { _id: 'updateOne_write_not_specified' },
    update: { $set: { v: 'after' } },
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
    'MongoDBUpdateOne request properties should be an object.'
  );
});

test('request no filter', async () => {
  const request = { update: {} };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBUpdateOne request should have required property "filter".'
  );
});

test('request no update', async () => {
  const request = { filter: {} };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBUpdateOne request should have required property "update".'
  );
});

test('request update not an object', async () => {
  const request = { update: 'update', filter: {} };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBUpdateOne request property "update" should be an object.'
  );
});

test('request filter not an object', async () => {
  const request = { update: {}, filter: 'filter' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBUpdateOne request property "filter" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { update: {}, filter: {}, options: 'options' };
  await expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  await expect(() => testSchema({ schema, object: request })).toThrow(
    'MongoDBUpdateOne request property "options" should be an object.'
  );
});
