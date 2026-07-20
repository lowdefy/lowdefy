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
import getConsecutiveIdIndex from '../getConsecutiveIdIndex.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongoDBInsertManyConsecutiveIds({
  blockId,
  connection,
  connectionId,
  pageId,
  payload,
  request,
  requestId,
}) {
  const deserializedRequest = deserialize(request);
  const { docs, options, prefix, length } = deserializedRequest;
  const { client, collection, logCollection } = await getCollection({ connection });

  // The id read and insert run in a transaction so concurrent requests cannot
  // claim the same ids. Transactions require MongoDB to run as a replica set.
  const session = client.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  let response = {};
  try {
    await session.withTransaction(async () => {
      const firstIndex = await getConsecutiveIdIndex({ collection, prefix, session });
      docs.forEach((doc, index) => {
        doc._id = `${prefix}${String(firstIndex + index).padStart(length, '0')}`;
      });
      response = await collection.insertMany(docs, { ...options, session });
      if (logCollection) {
        await logCollection.insertOne(
          {
            args: { docs, options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            response,
            timestamp: new Date(),
            type: 'MongoDBInsertManyConsecutiveIds',
            meta: connection.changeLog?.meta,
          },
          { session }
        );
      }
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  const { acknowledged, insertedIds } = serialize(response);
  return { acknowledged, insertedIds };
}

MongoDBInsertManyConsecutiveIds.schema = schema;
MongoDBInsertManyConsecutiveIds.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongoDBInsertManyConsecutiveIds;
