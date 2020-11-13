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

import mongodbDeleteOne from './deleteOne';
import populateTestMongoDb from '../../test/populateTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'deleteOne';
const documents = [
  { _id: 'deleteOne', v: 'before' },
  { _id: 'deleteOne_no_databaseUri', v: 'before' },
  { _id: 'deleteOne_databaseUri_not_a_string', v: 'before' },
  { _id: 'deleteOne_no_databaseName', v: 'before' },
  { _id: 'deleteOne_no_collection', v: 'before' },
  { _id: 'deleteOne_collection_not_a_string', v: 'before' },
  { _id: 'deleteOne_connection_error', v: 'before' },
  { _id: 'deleteOne_mongodb_error', v: 'before' },
  { _id: 'deleteOne_write_false', v: 'before' },
  { _id: 'deleteOne_write_not_specified', v: 'before' },
];

const context = { ConfigurationError, RequestError };

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
  const res = await mongodbDeleteOne({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 1,
  });
});

test('deleteOne no databaseUri', async () => {
  const request = { filter: { _id: 'deleteOne_no_databaseUri' } };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('deleteOne databaseUri not a string', async () => {
  const request = {
    filter: { _id: 'deleteOne_databaseUri_not_a_string' },
  };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('deleteOne no databaseName (optional)', async () => {
  const request = {
    filter: { _id: 'deleteOne_no_databaseName' },
  };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await mongodbDeleteOne({ request, connection, context });
  expect(res).toEqual({
    deletedCount: 1,
  });
});

test('deleteOne no collection', async () => {
  const request = { filter: { _id: 'deleteOne_no_collection' } };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('deleteOne collection not a string', async () => {
  const request = {
    filter: { _id: 'deleteOne_collection_not_a_string' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('deleteOne no filter', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Request filter not specified'
  );
});

test('deleteOne connection error', async () => {
  const request = {
    filter: { _id: 'deleteOne_connection_error' },
  };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('deleteOne write false', async () => {
  const request = { filter: { _id: 'deleteOne_write_false' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('deleteOne write not specified', async () => {
  const request = {
    filter: { _id: 'deleteOne_write_not_specified' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    ConfigurationError
  );
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('deleteOne catch invalid options', async () => {
  const request = {
    filter: { _id: 'deleteOne_mongodb_error' },
    options: { w: false },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(mongodbDeleteOne({ request, connection, context })).rejects.toThrow(
    'MongoError: w has to be a number or a string'
  );
});
