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

import mongodbDeleteMany from './deleteMany';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'deleteMany';
const documents = [
  { _id: 'deleteMany', v: 'before' },
  { _id: 'deleteMany_1', v: 'before' },
  { _id: 'deleteMany_2', v: 'before' },
  { _id: 'deleteMany_3', v: 'before' },
  { _id: 'deleteMany_4', v: 'before', f: 'deleteMany' },
  { _id: 'deleteMany_5', v: 'before', f: 'deleteMany' },
  { _id: 'deleteMany_6', v: 'before', f: 'deleteMany' },
  { _id: 'deleteMany_no_databaseUri', v: 'before' },
  { _id: 'deleteMany_databaseUri_not_a_string', v: 'before' },
  { _id: 'deleteMany_no_databaseName_1', v: 'before', f: 'deleteMany_no_db_name' },
  { _id: 'deleteMany_no_databaseName_2', v: 'before', f: 'deleteMany_no_db_name' },
  { _id: 'deleteMany_no_collection', v: 'before' },
  { _id: 'deleteMany_collection_not_a_string', v: 'before' },
  { _id: 'deleteMany_connection_error', v: 'before' },
  { _id: 'deleteMany_mongodb_error', v: 'before' },
  { _id: 'deleteMany_write_false', v: 'before' },
  { _id: 'deleteMany_write_not_specified', v: 'before' },
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
  const res = await mongodbDeleteMany({ request, connection, context });
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
  const res = await mongodbDeleteMany({ request, connection, context });
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
  const res = await mongodbDeleteMany({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 3,
  });
});

test('deleteMany no databaseUri', async () => {
  const request = {
    filter: { _id: 'deleteMany_no_databaseUri' },
  };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('deleteMany databaseUri not a string', async () => {
  const request = {
    filter: { _id: 'deleteMany_databaseUri_not_a_string' },
  };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('deleteMany no databaseName (optional)', async () => {
  const request = {
    filter: { f: 'deleteMany_no_db_name' },
  };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await mongodbDeleteMany({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 2,
  });
});

test('deleteMany no collection', async () => {
  const request = { filter: { _id: 'deleteMany_no_collection' } };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('deleteMany collection not a string', async () => {
  const request = {
    filter: { _id: 'deleteMany_collection_not_a_string' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('deleteMany no filter', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Request filter not specified'
  );
});
test('deleteMany connection error', async () => {
  const request = {
    filter: { _id: 'deleteMany_connection_error' },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('deleteMany mongodb error', async () => {
  const request = {
    filter: { _id: 'deleteMany_mongodb_error' },
    options: { w: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'MongoError: w has to be a number or a string'
  );
});

test('deleteMany write false', async () => {
  const request = { filter: { _id: 'deleteMany_write_false' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('deleteMany write not specified', async () => {
  const request = {
    filter: { _id: 'deleteMany_write_not_specified' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteMany({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});
