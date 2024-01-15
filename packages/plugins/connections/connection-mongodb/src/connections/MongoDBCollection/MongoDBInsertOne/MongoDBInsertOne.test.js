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
import { MongoClient } from 'mongodb';
import MongoDBInsertOne from './MongoDBInsertOne.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';

const { checkRead, checkWrite } = MongoDBInsertOne.meta;
const schema = MongoDBInsertOne.schema;

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertOne';

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
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne',
  });
});

test('insertOne options', async () => {
  const request = {
    doc: { _id: 'insertOne_options' },
    options: { writeConcern: { w: 'majority' } },
  };
  const connection = {
    databaseUri,
    databaseName,
    collection,
    write: true,
  };
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOne_options',
  });
});

test('insertOne connection error', async () => {
  const request = { doc: { _id: 'insertOne_connection_error' } };
  const connection = {
    databaseUri: 'bad_uri',
    databaseName,
    collection,
    write: true,
  };
  await expect(MongoDBInsertOne({ request, connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
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
  await MongoDBInsertOne({ request, connection });
  await expect(MongoDBInsertOne({ request, connection })).rejects.toThrow(
    'E11000 duplicate key error'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
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
  const res = await MongoDBInsertOne({ request, connection });
  expect(res).toEqual({
    acknowledged: true,
    insertedId: 'insertOneDate',
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

test('request not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request properties should be an object.'
  );
});

test('request no doc', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request should have required property "doc".'
  );
});

test('request doc not an object', async () => {
  const request = { doc: 'doc' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request property "doc" should be an object.'
  );
});

test('request options not an object', async () => {
  const request = { doc: {}, options: 'options' };
  expect(() => validate({ schema, data: request })).toThrow(
    'MongoDBInsertOne request property "options" should be an object.'
  );
});
