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
import markNotificationRead from './markNotificationRead.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'markNotificationRead';

const connection = {
  databaseUri,
  databaseName,
  collection,
};

beforeAll(async () => {
  await clearTestMongoDb({ collection });
  const client = new MongoClient(databaseUri);
  await client.connect();
  await client.db().collection(collection).insertOne({ _id: 'notification_1', read: false });
  await client.close();
});

test('markNotificationRead sets read to true', async () => {
  await markNotificationRead({ connection, id: 'notification_1' });
  const client = new MongoClient(databaseUri);
  await client.connect();
  let notification;
  try {
    notification = await client.db().collection(collection).findOne({ _id: 'notification_1' });
  } finally {
    await client.close();
  }
  expect(notification).toEqual({ _id: 'notification_1', read: true });
});
