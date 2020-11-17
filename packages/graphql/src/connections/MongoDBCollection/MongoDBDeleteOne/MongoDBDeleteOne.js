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
import checkWrite from '../checkWrite';

import schema from './MongoDBDeleteOneSchema.json';

async function mongodbDeleteOne({ request, connection, context }) {
  checkWrite({ connection, context });
  const deserializedRequest = deserialize(request);
  const { filter, options } = deserializedRequest;
  const { collection, client } = await getCollection({ connection, context });
  let res;
  try {
    res = await collection.deleteOne(filter, options);
  } catch (err) {
    await client.close();
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  await client.close();
  const { deletedCount } = serialize(res);
  return { deletedCount };
}

export default { resolver: mongodbDeleteOne, schema };
