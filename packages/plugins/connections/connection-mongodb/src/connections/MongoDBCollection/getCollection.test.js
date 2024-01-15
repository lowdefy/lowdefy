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
import { MongoClient, Collection } from 'mongodb';

import getCollection from './getCollection.js';

const databaseUri = process.env.MONGO_URL;

test('get collection', async () => {
  const connection = {
    databaseUri,
    databaseName: 'test',
    collection: 'getCollection',
  };
  const res = await getCollection({ connection });
  expect(res.client).toBeInstanceOf(MongoClient);
  expect(res.collection).toBeInstanceOf(Collection);
  await res.client.close();
});

test('get collection, no databaseName, uses databaseUri', async () => {
  const connection = {
    databaseUri,
    collection: 'getCollection',
  };
  const res = await getCollection({ connection });
  expect(res.client).toBeInstanceOf(MongoClient);
  expect(res.collection).toBeInstanceOf(Collection);
  await res.client.close();
});

test('invalid databaseUri', async () => {
  const connection = {
    databaseUri: 'databaseUri',
    databaseName: 'test',
    collection: 'getCollection',
  };
  await expect(() => getCollection({ connection })).rejects.toThrow(
    'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
  );
});

test('invalid databaseUri', async () => {
  const connection = {
    databaseUri: {},
    databaseName: 'test',
    collection: 'getCollection',
  };
  await expect(() => getCollection({ connection })).rejects.toThrow(
    'Database URI must be a string'
  );
});

test('invalid databaseName', async () => {
  const connection = {
    databaseUri,
    databaseName: {},
    collection: 'getCollection',
  };
  await expect(() => getCollection({ connection })).rejects.toThrow(
    'Database name must be a string'
  );
});

test('invalid collection', async () => {
  const connection = {
    databaseUri,
    databaseName: 'test',
    collection: {},
  };
  await expect(() => getCollection({ connection })).rejects.toThrow(
    'Collection name must be a string'
  );
});
