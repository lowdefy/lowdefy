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

import getCollection from '../getCollection.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

function checkOutAndMerge({ pipeline, connection }) {
  if (connection.write !== true) {
    pipeline.forEach((stage) => {
      if (stage.$out != null || stage.$merge != null) {
        throw new Error(
          'Connection does not allow writes and aggregation pipeline contains a "$merge" or "$out" stage.'
        );
      }
    });
  }
}

async function MongodbAggregation({ request, connection }) {
  const deserializedRequest = deserialize(request);
  const { pipeline, options } = deserializedRequest;
  checkOutAndMerge({ pipeline, connection });
  const { collection, client } = await getCollection({ connection });
  let res;
  try {
    const cursor = await collection.aggregate(pipeline, options);
    res = await cursor.toArray();
  } catch (error) {
    await client.close();
    throw error;
  }
  await client.close();
  return serialize(res);
}

MongodbAggregation.schema = schema;
MongodbAggregation.meta = {
  checkRead: true,
  checkWrite: false,
};

export default MongodbAggregation;
