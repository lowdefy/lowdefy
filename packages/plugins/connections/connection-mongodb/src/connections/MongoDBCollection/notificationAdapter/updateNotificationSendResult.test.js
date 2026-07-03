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
import updateNotificationSendResult from './updateNotificationSendResult.js';
import clearTestMongoDb from '../../../../test/clearTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const collection = 'updateNotificationSendResult';

const connection = {
  databaseUri,
  databaseName,
  collection,
};

beforeAll(async () => {
  await clearTestMongoDb({ collection });
  const client = new MongoClient(databaseUri);
  await client.connect();
  await client
    .db()
    .collection(collection)
    .insertMany([
      { _id: 'notification_1', sent: false, send_attempts: 0 },
      { _id: 'notification_2', sent: false, send_attempts: 0 },
    ]);
  await client.close();
});

async function findNotification(id) {
  const client = new MongoClient(databaseUri);
  await client.connect();
  try {
    return await client.db().collection(collection).findOne({ _id: id });
  } finally {
    await client.close();
  }
}

test('updateNotificationSendResult sets sent and email_result', async () => {
  await updateNotificationSendResult({
    connection,
    id: 'notification_1',
    sent: true,
    email_result: { messageId: 'message-id-1' },
  });
  expect(await findNotification('notification_1')).toEqual({
    _id: 'notification_1',
    sent: true,
    email_result: { messageId: 'message-id-1' },
    send_attempts: 0,
  });
});

test('updateNotificationSendResult increments send_attempts and sets last_attempt', async () => {
  const lastAttempt = new Date('2026-01-01T00:00:00.000Z');
  await updateNotificationSendResult({
    connection,
    id: 'notification_2',
    increment_send_attempts: true,
    last_attempt: lastAttempt,
  });
  await updateNotificationSendResult({
    connection,
    id: 'notification_2',
    increment_send_attempts: true,
    last_attempt: lastAttempt,
  });
  expect(await findNotification('notification_2')).toEqual({
    _id: 'notification_2',
    sent: false,
    send_attempts: 2,
    last_attempt: lastAttempt,
  });
});
