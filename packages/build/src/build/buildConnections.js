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

import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function buildConnections({ components, context }) {
  // Store connection IDs for validation in buildRequests
  context.connectionIds = new Set();

  // Schema validates: id required, id is string, type is string
  // Only check for duplicates here (schema can't do that)
  const checkDuplicateConnectionId = createCheckDuplicateId({
    message: 'Duplicate connectionId "{{ id }}".',
    context,
  });

  (components.connections ?? []).forEach((connection) => {
    const configKey = connection['~k'];

    // Check duplicates (schema can't validate this)
    checkDuplicateConnectionId({ id: connection.id, configKey });

    // Track type usage for buildTypes validation
    context.typeCounters.connections.increment(connection.type, configKey);

    // Store connectionId for request validation and rename id
    connection.connectionId = connection.id;
    context.connectionIds.add(connection.connectionId);
    connection.id = `connection:${connection.id}`;

    // Count operators in connection properties
    countOperators(connection.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildConnections;
