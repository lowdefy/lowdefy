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
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

function buildWebsockets({ components, context }) {
  if (components.websockets && !type.isArray(components.websockets)) {
    throw new ConfigError('Websockets is not an array.', { received: components.websockets });
  }
  const websockets = type.isArray(components.websockets) ? components.websockets : [];

  context.websocketIds = new Set();

  const checkDuplicateWebsocketId = createCheckDuplicateId({
    message: 'Duplicate websocketId "{{ id }}".',
  });

  websockets.forEach((websocket, index) => {
    const configKey = websocket['~k'];

    if (type.isUndefined(websocket.id)) {
      throw new ConfigError(`Websocket id missing at websocket ${index}.`, { configKey });
    }
    if (!type.isString(websocket.id)) {
      throw new ConfigError(`Websocket id is not a string at websocket ${index}.`, {
        received: websocket.id,
        configKey,
      });
    }
    validateId({ id: websocket.id, field: 'Websocket id', configKey });
    checkDuplicateWebsocketId({ id: websocket.id, configKey });

    if (!type.isString(websocket.type)) {
      throw new ConfigError(`Websocket type is not a string at websocket "${websocket.id}".`, {
        received: websocket.type,
        configKey,
      });
    }

    // Track type usage for buildTypes validation
    context.typeCounters.websockets.increment(websocket.type, configKey);

    // connectionId is optional — Channel and other connectionless types don't need one
    if (!type.isNone(websocket.connectionId)) {
      if (!type.isString(websocket.connectionId)) {
        throw new ConfigError(
          `Websocket connectionId is not a string at websocket "${websocket.id}".`,
          { received: websocket.connectionId, configKey }
        );
      }
      // Connections may have been renamed by buildConnections:
      //   connection.connectionId = original id, connection.id = 'connection:' + original id
      const connectionExists = (components.connections ?? []).some(
        (c) => c.id === websocket.connectionId || c.connectionId === websocket.connectionId
      );
      if (!connectionExists) {
        throw new ConfigError(
          `Websocket "${websocket.id}" references connectionId "${websocket.connectionId}" which does not exist.`,
          { configKey, checkSlug: 'connection-refs' }
        );
      }
    }

    if (type.isNone(websocket.properties)) {
      websocket.properties = {};
    }
    if (!type.isObject(websocket.properties)) {
      throw new ConfigError(
        `Websocket properties is not an object at websocket "${websocket.id}".`,
        { received: websocket.properties, configKey }
      );
    }

    // Rename id to internal format
    websocket.websocketId = websocket.id;
    context.websocketIds.add(websocket.websocketId);
    websocket.id = `websocket:${websocket.websocketId}`;

    // Count server operators in properties
    countOperators(websocket.properties, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildWebsockets;
