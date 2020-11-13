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

import mongodbUpdateMany from './updateMany';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateMany';
const documents = [
  { _id: 'updateMany', v: 'before' },
  { _id: 'updateMany_1', v: 'before' },
  { _id: 'updateMany_2', v: 'before' },
  { _id: 'updateMany_3', v: 'before' },
  { _id: 'updateMany_4', v: 'before', f: 'updateMany' },
  { _id: 'updateMany_5', v: 'before', f: 'updateMany' },
  { _id: 'updateMany_6', v: 'before', f: 'updateMany' },
  { _id: 'updateMany_no_databaseUri', v: 'before' },
  { _id: 'updateMany_databaseUri_not_a_string', v: 'before' },
  { _id: 'updateMany_no_databaseName_1', v: 'before', f: 'updateMany_no_db_name' },
  { _id: 'updateMany_no_databaseName_2', v: 'before', f: 'updateMany_no_db_name' },
  { _id: 'updateMany_no_collection', v: 'before' },
  { _id: 'updateMany_collection_not_a_string', v: 'before' },
  { _id: 'updateMany_no_update', v: 'before' },
  { _id: 'updateMany_connection_error', v: 'before' },
  { _id: 'updateMany_mongodb_error', v: 'before' },
  { _id: 'updateMany_write_false', v: 'before' },
  { _id: 'updateMany_write_not_specified', v: 'before' },
];

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return populateTestMongoDb({ collection, documents });
});

test('updateMany - Single Document', async () => {
  const request = {
    filter: { _id: 'updateMany' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 1,
  });
});

test('updateMany - Multiple Documents', async () => {
  const request = {
    filter: { _id: { $in: ['updateMany_1', 'updateMany_2', 'updateMany_3'] } },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 3,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 3,
  });
});

test('updateMany - Multiple Documents one field', async () => {
  const request = {
    filter: { f: 'updateMany' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 3,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 3,
  });
});

test('updateMany upsert', async () => {
  const request = {
    filter: { _id: 'updateMany_upsert' },
    update: { $set: { v: 'after' } },
    options: { upsert: true },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: {
      _id: 'updateMany_upsert',
      index: 0,
    },
    upsertedCount: 1,
    matchedCount: 0,
  });
});

test('updateMany upsert false', async () => {
  const request = {
    filter: { _id: 'updateMany_upsert_false' },
    update: { $set: { v: 'after' } },
    options: { upsert: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateMany upsert default false', async () => {
  const request = {
    filter: { _id: 'updateMany_upsert_default_false' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 0,
  });
});

test('updateMany no databaseUri', async () => {
  const request = {
    filter: { _id: 'updateMany_no_databaseUri' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('updateMany databaseUri not a string', async () => {
  const request = {
    filter: { _id: 'updateMany_databaseUri_not_a_string' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('updateMany no databaseName (optional)', async () => {
  const request = {
    filter: { f: 'updateMany_no_db_name' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await mongodbUpdateMany({ request, connection, context });
  expect(res).toEqual({
    modifiedCount: 2,
    upsertedId: null,
    upsertedCount: 0,
    matchedCount: 2,
  });
});

test('updateMany no collection', async () => {
  const request = { filter: { _id: 'updateMany_no_collection' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('updateMany collection not a string', async () => {
  const request = {
    filter: { _id: 'updateMany_collection_not_a_string' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('updateMany no update', async () => {
  const request = {
    filter: { _id: 'updateMany_no_update' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Request update not specified'
  );
});

test('updateMany no filter', async () => {
  const request = {
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Request filter not specified'
  );
});
test('updateMany connection error', async () => {
  const request = {
    filter: { _id: 'updateMany_connection_error' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('updateMany mongodb error', async () => {
  const request = {
    filter: { _id: 'updateMany_mongodb_error' },
    update: { $badOp: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'MongoError: Unknown modifier: $badOp'
  );
});

test('updateMany write false', async () => {
  const request = { filter: { _id: 'updateMany_write_false' }, update: { $set: { v: 'after' } } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('updateMany write not specified', async () => {
  const request = {
    filter: { _id: 'updateMany_write_not_specified' },
    update: { $set: { v: 'after' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbUpdateMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});
