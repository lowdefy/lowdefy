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
import validateId from '../utils/validateId.js';

function validateWebsocket(websocket, index, context) {
  const configKey = websocket?.['~k'];
  if (!type.isObject(websocket)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket should be an object at websocket ${index}.`, {
        received: websocket,
        configKey,
      })
    );
    return false;
  }
  if (type.isUndefined(websocket.id)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket id missing at websocket ${index}.`, { configKey })
    );
    return false;
  }
  if (!type.isString(websocket.id)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket id is not a string at websocket ${index}.`, {
        received: websocket.id,
        configKey,
      })
    );
    return false;
  }
  if (!type.isString(websocket.type)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket type is not a string at websocket "${websocket.id}".`, {
        received: websocket.type,
        configKey,
      })
    );
    return false;
  }
  return true;
}

// connectionId is optional — Channel and other connectionless types don't need one
function validateConnectionRef(websocket, components, context) {
  const configKey = websocket['~k'];
  if (type.isNone(websocket.connectionId)) return true;
  if (!type.isString(websocket.connectionId)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket connectionId is not a string at websocket "${websocket.id}".`, {
        received: websocket.connectionId,
        configKey,
      })
    );
    return false;
  }
  // Connections may have been renamed by buildConnections:
  //   connection.connectionId = original id, connection.id = 'connection:' + original id
  const connectionExists = (components.connections ?? []).some(
    (c) => c.id === websocket.connectionId || c.connectionId === websocket.connectionId
  );
  if (!connectionExists) {
    collectExceptions(
      context,
      new ConfigError(
        `Websocket "${websocket.id}" references connectionId "${websocket.connectionId}" which does not exist.`,
        { configKey, checkSlug: 'connection-refs' }
      )
    );
    return false;
  }
  return true;
}

function validateProperties(websocket, context) {
  const configKey = websocket['~k'];
  if (type.isNone(websocket.properties)) {
    websocket.properties = {};
  }
  if (!type.isObject(websocket.properties)) {
    collectExceptions(
      context,
      new ConfigError(`Websocket properties is not an object at websocket "${websocket.id}".`, {
        received: websocket.properties,
        configKey,
      })
    );
    return false;
  }

  // The only websocket-level tenant value is the explicit opt-out sentinel —
  // the wall itself is declared on the connection, never per websocket.
  // ("authored" is aggregation-only: change-stream pipelines never carry
  // the first-stage-only stages it exists for, so it is rejected here.)
  if (!type.isUndefined(websocket.tenant) && websocket.tenant !== 'none') {
    collectExceptions(
      context,
      new ConfigError(
        `Websocket "${websocket.id}" "tenant" only accepts "none" — the tenant wall is declared on the connection, and "authored" is aggregation-only.`,
        { received: websocket.tenant, configKey }
      )
    );
    return false;
  }
  return true;
}

function buildWebsockets({ components, context }) {
  if (components.websockets && !type.isArray(components.websockets)) {
    throw new ConfigError('Websockets is not an array.', {
      received: components.websockets,
      configKey: components['~k'],
    });
  }
  const websockets = type.isArray(components.websockets) ? components.websockets : [];

  context.websocketIds = new Set();

  const checkDuplicateWebsocketId = createCheckDuplicateId({
    message: 'Duplicate websocketId "{{ id }}".',
  });

  websockets.forEach((websocket, index) => {
    if (!validateWebsocket(websocket, index, context)) return;

    const configKey = websocket['~k'];

    validateId({ id: websocket.id, field: 'Websocket id', configKey });
    checkDuplicateWebsocketId({ id: websocket.id, configKey });

    // Track type usage for buildTypes validation
    context.typeCounters.websockets.increment(websocket.type, configKey);

    if (!validateConnectionRef(websocket, components, context)) return;
    if (!validateProperties(websocket, context)) return;

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
