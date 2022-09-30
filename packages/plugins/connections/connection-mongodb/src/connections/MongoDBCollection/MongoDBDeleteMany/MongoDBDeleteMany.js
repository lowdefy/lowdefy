/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongodbDeleteMany({ blockId, connection, pageId, request, requestId, payload }) {
  const deserializedRequest = deserialize(request);
  const { filter, options } = deserializedRequest;
  const { collection, client, logCollection } = await getCollection({ connection });
  let response;
  try {
    response = await collection.deleteMany(filter, options);
    if (logCollection) {
      await logCollection.insertOne({
        args: { filter, options },
        blockId,
        pageId,
        payload,
        requestId,
        response,
        timestamp: new Date(),
        type: 'MongoDBInsertMany',
        user: connection.changeLog?.user,
      });
    }
  } catch (error) {
    await client.close();
    throw error;
  }
  await client.close();
  const { acknowledged, deletedCount } = serialize(response);
  return { acknowledged, deletedCount };
}

MongodbDeleteMany.schema = schema;
MongodbDeleteMany.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbDeleteMany;
