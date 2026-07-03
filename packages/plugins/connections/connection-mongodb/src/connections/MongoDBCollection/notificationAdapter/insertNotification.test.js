/*
  Copyright 2020-2026 Lowdefy, Inc

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
import insertNotification from './insertNotification.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'insertNotification';

const connection = {
  databaseUri,
  databaseName,
  collection,
};

beforeAll(() => {
  return clearTestMongoDb({ collection });
});

async function findInCollection(query) {
  const client = new MongoClient(databaseUri);
  await client.connect();
  try {
    return await client.db().collection(collection).find(query).toArray();
  } finally {
    await client.close();
  }
}

test('insertNotification inserts and returns the notification', async () => {
  const notification = { _id: 'notification_1', key: 'key_1', read: false };
  const res = await insertNotification({ connection, notification });
  expect(res).toEqual(notification);
  const docs = await findInCollection({ _id: 'notification_1' });
  expect(docs).toEqual([{ _id: 'notification_1', key: 'key_1', read: false }]);
});

test('insertNotification returns null on duplicate key and keeps one document', async () => {
  const first = { _id: 'duplicate_1', key: 'duplicate_key' };
  const second = { _id: 'duplicate_2', key: 'duplicate_key' };
  expect(await insertNotification({ connection, notification: first })).toEqual(first);
  expect(await insertNotification({ connection, notification: second })).toBe(null);
  const docs = await findInCollection({ key: 'duplicate_key' });
  expect(docs).toEqual([{ _id: 'duplicate_1', key: 'duplicate_key' }]);
});

test('insertNotification allows multiple notifications with key null', async () => {
  const first = { _id: 'null_key_1', key: null };
  const second = { _id: 'null_key_2', key: null };
  expect(await insertNotification({ connection, notification: first })).toEqual(first);
  expect(await insertNotification({ connection, notification: second })).toEqual(second);
  const docs = await findInCollection({ key: null });
  expect(docs).toEqual([
    { _id: 'null_key_1', key: null },
    { _id: 'null_key_2', key: null },
  ]);
});

test('insertNotification creates the partial unique key index', async () => {
  await insertNotification({ connection, notification: { _id: 'index_check', key: 'index_key' } });
  const client = new MongoClient(databaseUri);
  await client.connect();
  let indexes;
  try {
    indexes = await client.db().collection(collection).indexes();
  } finally {
    await client.close();
  }
  const keyIndex = indexes.find((index) => index.name === 'notification_key_unique');
  expect(keyIndex).toMatchObject({
    key: { key: 1 },
    unique: true,
    partialFilterExpression: { key: { $type: 'string' } },
  });
});

test('insertNotification rethrows non dedup key duplicate errors', async () => {
  const notification = { _id: 'same_id', key: 'same_id_key_1' };
  await insertNotification({ connection, notification });
  await expect(
    insertNotification({ connection, notification: { _id: 'same_id', key: 'same_id_key_2' } })
  ).rejects.toThrow('E11000 duplicate key error');
});
