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
import { type } from '@lowdefy/helpers';
import {
  createChannelRegistry,
  createWebSocketConnection,
  isWebSocketOriginAllowed,
} from '@lowdefy/api';

import getStrategies from '../../lib/server/auth/getStrategies.js';

// One registry per server process — channels and their running source
// resolvers are shared across all websocket connections on this instance.
const registry = createChannelRegistry();

// The code a browser's WebSocket reports when the server goes away; the client
// reconnects and resubscribes on any close but a caller change.
const MAX_DURATION_CLOSE_CODE = 1001;
const MAX_DURATION_CLOSE_MARGIN_MS = 5 * 1000;

// maxDurationMs is how long the platform lets the function run (Vercel's
// maxDuration). The platform stops the function there without a close frame,
// and a browser only notices the dead socket about 10 s later, missing every
// change in between. Closing the socket a little before the limit lets the
// browser reconnect at once. A limit under 10 s closes at half of it, so the
// socket is not closed as soon as it opens.
function createWebsocketHandler({ maxDurationMs } = {}) {
  const closeAfterMs = type.isNone(maxDurationMs)
    ? null
    : Math.max(maxDurationMs - MAX_DURATION_CLOSE_MARGIN_MS, maxDurationMs / 2);

  const upgrade = upgradeWebSocket((c) => {
    const context = c.get('lowdefyContext');
    let connection;
    let maxDurationTimer = null;
    return {
      onOpen(event, ws) {
        // The upgrade's headers stay with the connection: its caller is resolved
        // from them again while the socket is open - a browser's session cookie,
        // or a phone shell's "Authorization: Bearer" session, read the same way.
        connection = createWebSocketConnection(context, {
          closeSocket: ({ code, reason }) => ws.close(code, reason),
          headers: c.req.raw.headers,
          registry,
          send: (message) => ws.send(message),
          strategies: getStrategies({ logger: context.logger }),
        });
        if (!type.isNone(closeAfterMs)) {
          maxDurationTimer = setTimeout(
            () => ws.close(MAX_DURATION_CLOSE_CODE, 'max-duration'),
            closeAfterMs
          );
        }
      },
      onMessage(event) {
        connection?.handleMessage(event.data);
      },
      onClose() {
        clearTimeout(maxDurationTimer);
        connection?.close();
      },
      onError(event) {
        // A transport fault, not routine traffic: visible at the default level with
        // the error object attached so the cause is not reduced to a string.
        context.logger.warn({ event: 'ws_error', err: event?.error }, 'WebSocket error.');
      },
    };
  });

  // Upgrades are accepted from the app's own pages and from clients that send no
  // Origin (a phone shell sends the app's own); isWebSocketOriginAllowed holds the
  // rule and logs a refusal.
  return function websocketHandler(c, next) {
    const context = c.get('lowdefyContext');
    if (!isWebSocketOriginAllowed({ context, getHeader: (name) => c.req.header(name) })) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    return upgrade(c, next);
  };
}

export default createWebsocketHandler;
