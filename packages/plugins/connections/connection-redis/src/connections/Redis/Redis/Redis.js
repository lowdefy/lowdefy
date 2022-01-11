/*
  Copyright 2020-2021 Lowdefy, Inc

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
  const client = new createClient(connection);
  client.on('error', (error) => {
    throw error;
  });

  try {
    const { command, params, modifiers } = request;
    await client.connect();
    const commandParams = type.isArray(params) ? params : [params];
    const commandReturn = await client[command.toUpperCase()](...commandParams, modifiers);
    await client.quit();
    return commandReturn;
  } catch (error) {
    if (error.code !== 'ECONNREFUSED') {
      await client.quit();
    }
    throw error;
  }
}

Redis.schema = schema;
Redis.meta = {
  checkRead: false,
  checkWrite: false,
};

export default Redis;
