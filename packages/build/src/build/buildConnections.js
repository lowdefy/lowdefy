/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function validateConnection(connection, context) {
  const configKey = connection?.['~k'];
  if (!type.isObject(connection)) {
    collectExceptions(
      context,
      new ConfigError('Connection should be an object.', { received: connection, configKey })
    );
    return false;
  }
  if (type.isUndefined(connection.id)) {
    collectExceptions(
      context,
      new ConfigError('Connection id missing.', { configKey })
    );
    return false;
  }
  if (!type.isString(connection.id)) {
    collectExceptions(
      context,
      new ConfigError('Connection id is not a string.', { received: connection.id, configKey })
    );
    return false;
  }
  if (type.isNone(connection.type)) {
    collectExceptions(
      context,
      new ConfigError(`Connection type is not defined at connection "${connection.id}".`, {
        configKey,
      })
    );
    return false;
  }
  if (!type.isString(connection.type)) {
    collectExceptions(
      context,
      new ConfigError(`Connection type is not a string at connection "${connection.id}".`, {
        received: connection.type,
        configKey,
      })
    );
    return false;
  }
  return true;
}

function buildConnections({ components, context }) {
  // Store connection IDs for validation in buildRequests
  context.connectionIds = new Set();

  const checkDuplicateConnectionId = createCheckDuplicateId({
    message: 'Duplicate connectionId "{{ id }}".',
  });

  (components.connections ?? []).forEach((connection) => {
    if (!validateConnection(connection, context)) return;

    const configKey = connection['~k'];

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
