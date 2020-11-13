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

import { MongoClient } from 'mongodb';
import insertOne from './insertOne';
import clearTestMongoDb from '../../test/clearTestMongoDb';
import { ConfigurationError, RequestError } from '../../context/errors';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertOne';

const context = { ConfigurationError, RequestError };

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

test('insertOne', async () => {
  const request = { doc: { _id: 'insertOne' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await insertOne({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 1,
    insertedId: 'insertOne',
    ops: [
      {
        _id: 'insertOne',
      },
    ],
  });
});

test('insertOne options', async () => {
  const request = {
    doc: { _id: 'insertOne_options' },
    options: { w: 'majority' },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await insertOne({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 1,
    insertedId: 'insertOne_options',
    ops: [
      {
        _id: 'insertOne_options',
      },
    ],
  });
});

test('insertOne no databaseUri', async () => {
  const request = { doc: { _id: 'insertOne_no_databaseUri' } };
  const connection = {
    databaseName,
    collection,
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri not specified'
  );
});

test('insertOne databaseUri not a string', async () => {
  const request = { doc: { _id: 'insertOne_databaseUri_not_a_string' } };
  const connection = {
    databaseUri: {},
    databaseName,
    collection,
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection databaseUri is not a string'
  );
});

test('insertOne no databaseName (optional)', async () => {
  const request = { doc: { _id: 'insertOne_no_databaseName' } };
  const connection = {
    databaseUri,
    collection,
    write: true,
  };
  const res = await insertOne({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 1,
    insertedId: 'insertOne_no_databaseName',
    ops: [
      {
        _id: 'insertOne_no_databaseName',
      },
    ],
  });
});

test('insertOne no collection', async () => {
  const request = { doc: { _id: 'insertOne_no_collection' } };
  const connection = {
    databaseUri,
    databaseName,
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection collection not specified'
  );
});

test('insertOne collection not a string', async () => {
  const request = { doc: { _id: 'insertOne_collection_not_a_string' } };
  const connection = {
    databaseUri,
    databaseName,
    collection: {},
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection collection is not a string'
  );
});

test('insertOne no doc', async () => {
  const request = {};
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Request doc not specified'
  );
});

test('insertOne connection error', async () => {
  const request = { doc: { _id: 'insertOne_connection_error' } };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Invalid connection string'
  );
});

test('insertOne mongodb error', async () => {
  const request = { doc: { _id: 'insertOne_mongodb_error' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  await insertOne({ request, connection, context });
  await expect(insertOne({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'MongoError: E11000 duplicate key error dup key'
  );
});

test('insertOne write false', async () => {
  const request = { doc: { _id: 'insertOne_write_false' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: false,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('insertOne write not specified', async () => {
  const request = { doc: { _id: 'insertOne_write_not_specified' } };
  const connection = {
    databaseUri,
    databaseName,
    collection,
  };
  await expect(insertOne({ request, connection, context })).rejects.toThrow(ConfigurationError);
  await expect(insertOne({ request, connection, context })).rejects.toThrow(
    'Connection does not allow writes'
  );
});

test('insertOne insert a date', async () => {
  const request = {
    doc: {
      _id: 'insertOneDate',
      date: new Date('2020-01-01'),
    },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await insertOne({ request, connection, context });
  expect(res).toEqual({
    insertedCount: 1,
    insertedId: 'insertOneDate',
    ops: [
      {
        _id: 'insertOneDate',
        date: {
          _date: 1577836800000,
        },
      },
    ],
  });
  let client;
  let inserted;
  try {
    client = new MongoClient(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    const db = client.db();
    inserted = await db.collection(collection).findOne({ _id: 'insertOneDate' });
    await client.close();
  } catch (error) {
    await client.close();
  }
  expect(inserted).toEqual({
    _id: 'insertOneDate',
    date: new Date('2020-01-01'),
  });
});
