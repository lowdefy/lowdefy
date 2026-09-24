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

import { upgradeWebSocket } from '@hono/node-server';
import { createChannelRegistry, createWebSocketConnection } from '@lowdefy/api';

// One registry per server process — channels and their running source
// resolvers are shared across all websocket connections on this instance.
const registry = createChannelRegistry();

const websocketHandler = upgradeWebSocket((c) => {
  const context = c.get('lowdefyContext');
  let connection;
  return {
    onOpen(event, ws) {
      connection = createWebSocketConnection(context, {
        registry,
        send: (message) => ws.send(message),
      });
    },
    onMessage(event) {
      connection?.handleMessage(event.data);
    },
    onClose() {
      connection?.close();
    },
    onError(event) {
      // A transport fault, not routine traffic: visible at the default level with
      // the error object attached so the cause is not reduced to a string.
      context.logger.warn({ event: 'ws_error', err: event?.error }, 'WebSocket error.');
    },
  };
});

export default websocketHandler;
