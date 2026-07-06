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

import authorizeWebsocket from './authorizeWebsocket.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getWebsocketConfig from './getWebsocketConfig.js';
import getWebsocketResolver from './getWebsocketResolver.js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// Shared preparation for subscribe and publish frames: load config, authorize,
// resolve the websocket type, and evaluate server operators per subscription.
// Properties are evaluated with the subscriber's payload and user, so the same
// websocket definition can produce user- or filter-specific channels. The
// evaluated result is the channel identity — subscribers whose evaluation is
// identical share one running source.
async function prepareChannel(context, { websocketId, payload }) {
  context.evaluateOperators = createEvaluateOperators(context);

  const websocketConfig = await getWebsocketConfig(context, { websocketId });
  authorizeWebsocket(context, { websocketConfig });
  const websocketResolver = getWebsocketResolver(context, { websocketConfig });

  let connectionProperties = null;
  if (!type.isNone(websocketConfig.connectionId)) {
    const connectionConfig = await getConnectionConfig(context, {
      connectionId: websocketConfig.connectionId,
      configKey: websocketConfig['~k'],
    });
    // Validates the connection type exists — resolver lookup is on the
    // websocket type itself, not nested on the connection.
    getConnection(context, { connectionConfig });
    connectionProperties = context.evaluateOperators({
      input: connectionConfig.properties ?? {},
      location: connectionConfig.connectionId,
      payload,
      state: {},
      steps: {},
    });
  }

  const properties = context.evaluateOperators({
    input: websocketConfig.properties ?? {},
    location: websocketConfig.websocketId,
    payload,
    state: {},
    steps: {},
  });

  return { connectionProperties, properties, websocketConfig, websocketResolver };
}

export default prepareChannel;
