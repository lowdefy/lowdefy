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

import { MongoClient } from 'mongodb';
import { get, type } from '@lowdefy/helpers';
import { serialize, deserialize } from './serialize';

function validateRequest({ request, context }) {
  if (!request.docs) {
    throw new context.ConfigurationError('Request docs not specified');
  }
}

function validateConnection({ connection, context }) {
  if (!connection.databaseUri) {
    throw new context.ConfigurationError('Connection databaseUri not specified');
  }
  if (!type.isString(connection.databaseUri)) {
    throw new context.ConfigurationError('Connection databaseUri is not a string');
  }
  if (!connection.collection) {
    throw new context.ConfigurationError('Connection collection not specified');
  }
  if (!type.isString(connection.collection)) {
    throw new context.ConfigurationError('Connection collection is not a string');
  }
  if (!get(connection, 'write', { default: false })) {
    throw new context.ConfigurationError('Connection does not allow writes');
  }
}

async function mongodbInsertMany({ request, connection, context }) {
  validateRequest({ request, context });
  validateConnection({ connection, context });
  const deserializedRequest = deserialize(request);
  const { docs, options } = deserializedRequest;
  const { databaseUri, databaseName, collection } = connection;
  let client;
  try {
    client = new MongoClient(databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  } catch (err) {
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  let res;
  try {
    const db = client.db(databaseName);
    res = await db.collection(collection).insertMany(docs, options);
  } catch (err) {
    await client.close();
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  await client.close();
  const { insertedCount, ops } = serialize(res);
  return { insertedCount, ops };
}

export default mongodbInsertMany;
