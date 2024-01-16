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

import knex from 'knex';
import { type } from '@lowdefy/helpers';
import schema from './schema.js';

async function KnexBuilder({ request, connection }) {
  let client = knex(connection);
  if (request.tableName) {
    client = client(request.tableName);
  }
  for (const method of request.query) {
    if (Object.keys(method).length !== 1) {
      throw new Error(
        `Invalid query, more than one method defined in a method object, received ${JSON.stringify(
          Object.keys(method)
        )}.`
      );
    }
    const methodName = Object.keys(method)[0];
    const methodArgs = method[methodName];
    if (!type.isArray(methodArgs)) {
      throw new Error(
        `Invalid query, method "${methodName}" arguments should be an array, received ${JSON.stringify(
          methodArgs
        )}.`
      );
    }
    if (!type.isFunction(client[methodName])) {
      throw new Error(`Invalid query builder method "${methodName}".`);
    }
    client = client[methodName](...methodArgs);
  }
  return client;
}

KnexBuilder.schema = schema;
KnexBuilder.meta = {
  checkRead: false,
  checkWrite: false,
};

export default KnexBuilder;
