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

import getCollection from '../getCollection.js';

// Memo saves a round trip on every insert; createIndex is idempotent and the
// index persists server-side, so a fresh process just recreates it once.
const ensuredKeyIndexes = new Set();

async function insertNotification({ connection, notification }) {
  const { collection, client } = await getCollection({ connection });
  try {
    const memoKey = `${connection.databaseUri}|${connection.databaseName ?? ''}|${
      connection.collection
    }`;
    if (!ensuredKeyIndexes.has(memoKey)) {
      // Partial (not sparse) because records store `key: null` and a sparse
      // unique index still indexes explicit nulls - two null-keyed records
      // would collide; the partial index dedupes only keyed records.
      await collection.createIndex(
        { key: 1 },
        {
          unique: true,
          partialFilterExpression: { key: { $type: 'string' } },
          name: 'notification_key_unique',
        }
      );
      ensuredKeyIndexes.add(memoKey);
    }
    await collection.insertOne(notification);
    return notification;
  } catch (error) {
    // A duplicate dedup key means the notification was already created - skip
    // silently. Any other duplicate (e.g. _id) is a real bug and rethrows.
    if (error.code === 11000 && error.keyPattern?.key) {
      return null;
    }
    throw error;
  } finally {
    await client.close();
  }
}

export default insertNotification;
