/*
  Copyright 2020 Lowdefy, Inc

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

import getCollection from '../getCollection';
import { serialize, deserialize } from '../serialize';

import schema from './MongoDBInsertOneSchema.json';

async function mongodbInsertOne({ request, connection }) {
  const deserializedRequest = deserialize(request);
  const { doc, options } = deserializedRequest;
  const { collection, client } = await getCollection({ connection });
  let res;
  try {
    res = await collection.insertOne(doc, options);
  } catch (error) {
    await client.close();
    throw error;
  }
  await client.close();
  const { insertedCount, insertedId, ops } = serialize(res);
  return { insertedCount, insertedId, ops };
}

export default { resolver: mongodbInsertOne, schema, checkRead: false, checkWrite: true };
