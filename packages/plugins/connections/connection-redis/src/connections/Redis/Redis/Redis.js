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

import { type } from '@lowdefy/helpers';
import { createClient } from 'redis';
import schema from './schema.js';

async function Redis({ request, connection }) {
  const connectionObject = type.isString(connection.connection)
    ? { url: connection.connection }
    : connection.connection;

  const client = new createClient(connectionObject);
  client.on('error', (error) => {
    throw error;
  });

  const { command, parameters, modifiers } = request;
  await client.connect();

  if (!type.isFunction(client[command.toUpperCase()])) {
    throw new Error(`Invalid redis command "${command}".`);
  }

  if (!type.isArray(parameters)) {
    throw new Error(
      `Invalid parameters, command "${command}" parameters should be an array, received ${JSON.stringify(
        parameters
      )}.`
    );
  }

  const upperCaseModifiers = Object.entries(modifiers).reduce((acc, [key, value]) => {
    acc[key.toUpperCase()] = value;
    return acc;
  }, {});

  try {
    const commandReturn = await client[command.toUpperCase()](...parameters, upperCaseModifiers);
    await client.quit();
    return commandReturn;
  } catch (error) {
    client.quit();
    throw error;
  }
}

Redis.schema = schema;
Redis.meta = {
  checkRead: false,
  checkWrite: false,
};

export default Redis;
