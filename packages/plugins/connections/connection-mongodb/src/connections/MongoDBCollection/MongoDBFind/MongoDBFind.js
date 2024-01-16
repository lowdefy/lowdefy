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

async function MongodbFind({ request, connection }) {
  const deserializedRequest = deserialize(request);
  const { query, options } = deserializedRequest;
  const { collection, client } = await getCollection({ connection });
  let res;
  try {
    const cursor = await collection.find(query, options);
    res = await cursor.toArray();
  } catch (error) {
    await client.close();
    throw error;
  }
  await client.close();
  return serialize(res);
}

MongodbFind.schema = schema;
MongodbFind.meta = {
  checkRead: true,
  checkWrite: false,
};

export default MongodbFind;
