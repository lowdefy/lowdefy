/* eslint-disable no-param-reassign */

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
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function buildConnections({ components, context }) {
  const checkDuplicateConnectionId = createCheckDuplicateId({
    message: 'Duplicate connectionId "{{ id }}".',
  });
  if (type.isArray(components.connections)) {
    components.connections.forEach((connection) => {
      if (type.isUndefined(connection.id)) {
        throw new Error(`Connection id missing.`);
      }
      if (!type.isString(connection.id)) {
        throw new Error(
          `Connection id is not a string. Received ${JSON.stringify(connection.id)}.`
        );
      }
      checkDuplicateConnectionId({ id: connection.id });
      if (!type.isString(connection.type)) {
        throw new Error(
          `Connection type is not a string at connection "${
            connection.id
          }". Received ${JSON.stringify(connection.type)}.`
        );
      }
      context.typeCounters.connections.increment(connection.type);
      connection.connectionId = connection.id;
      connection.id = `connection:${connection.id}`;
      countOperators(connection.properties || {}, {
        counter: context.typeCounters.operators.server,
      });
    });
  }
  return components;
}

export default buildConnections;
