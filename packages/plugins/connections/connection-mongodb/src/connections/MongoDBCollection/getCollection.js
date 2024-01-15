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

import { MongoClient } from 'mongodb';
import { type } from '@lowdefy/helpers';

async function getCollection({ connection }) {
  const { collection, databaseName, databaseUri, options } = connection;
  if (!type.isString(databaseUri)) {
    throw new Error('Database URI must be a string');
  }
  const client = new MongoClient(databaseUri, options);
  await client.connect();
  try {
    if (!type.isString(databaseName) && !type.isNone(databaseName)) {
      throw new Error('Database name must be a string');
    }
    const db = client.db(databaseName);
    if (!type.isString(collection)) {
      throw new Error('Collection name must be a string');
    }
    return {
      client,
      collection: db.collection(collection),
    };
  } catch (error) {
    await client.close();
    throw error;
  }
}

export default getCollection;
