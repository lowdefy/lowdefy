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
import getAuthenticationHeaders from '../lib/getAuthenticationHeaders.js';
import getViewOrigins from '../lib/getViewOrigins.js';

// One registry per server process — channels and their running source
// resolvers are shared across all websocket connections on this instance.
const registry = createChannelRegistry();

const upgrade = upgradeWebSocket((c) => {
  const context = c.get('lowdefyContext');
  let connection;
  return {
    onOpen(event, ws) {
      // The upgrade's headers stay with the connection: its caller is resolved
      // from them again while the socket is open - a browser's session cookie,
      // a phone shell's "Authorization: Bearer" session, or a view's bearer
      // session from its subprotocol (getAuthenticationHeaders), read the same way.
      connection = createWebSocketConnection(context, {
        closeSocket: ({ code, reason }) => ws.close(code, reason),
        headers: getAuthenticationHeaders(c),
        registry,
        send: (message) => ws.send(message),
        strategies: getStrategies({ logger: context.logger }),
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

// Upgrades are accepted from the app's own pages, from clients that send no
// Origin (a phone shell sends the app's own) and from an MCP App view's origin;
// isWebSocketOriginAllowed holds the rule and logs a refusal.
//
// A view's origin is another site, so its upgrade must also carry a view
// session: the bearer its handshake sends as a subprotocol
// (readViewSocketToken), which apiContext resolved the caller from. With no
// token, a bad token or an ended session there is none, and the upgrade is
// refused with the 401 a view mints a new session on.
function websocketHandler(c, next) {
  const context = c.get('lowdefyContext');
  const viewOrigins = getViewOrigins();
  if (
    !isWebSocketOriginAllowed({ context, getHeader: (name) => c.req.header(name), viewOrigins })
  ) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  if (viewOrigins.includes(c.req.header('origin')) && type.isNone(context.viewSession)) {
    context.logger.warn({ event: 'ws_view_session_missing', origin: c.req.header('origin') });
    return c.json({ name: 'AuthenticationError', message: 'A view session is required.' }, 401);
  }
  return upgrade(c, next);
}

export default websocketHandler;
