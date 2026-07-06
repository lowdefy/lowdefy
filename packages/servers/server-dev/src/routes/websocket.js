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

import { setPendingWebSocketContext } from '../websocket/devWebSocket.js';

// In dev, Vite owns the HTTP server, so websocket upgrades can't flow through
// @hono/node-server. The Vite plugin (see vite.config.js) fetches this route
// with the upgrade request's headers to run the full middleware chain (auth
// session, apiContext), and this handler hands the built context back to the
// upgrade handler through a pending-context exchange keyed by request id.
function websocketHandler(c) {
  const rid = c.req.header('x-lowdefy-websocket-rid');
  if (!rid) {
    return c.json({ message: 'WebSocket upgrade required.' }, 400);
  }
  setPendingWebSocketContext(rid, c.get('lowdefyContext'));
  return c.json({ ok: true });
}

export default websocketHandler;
