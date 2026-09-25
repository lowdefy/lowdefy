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

// In dev, Vite owns the HTTP server, so websocket upgrades can't flow through
// @hono/node-server. The upgrade handler (src/websocket/devWebSocket.js) runs
// this route with the upgrade request's headers so the full middleware chain
// (auth session, apiContext) builds the request context, and passes a
// websocketUpgrade object in the Hono env; this handler puts the context on
// it. A plain HTTP request to this route carries no such object.
function websocketHandler(c) {
  const websocketUpgrade = c.env?.websocketUpgrade;
  if (type.isNone(websocketUpgrade)) {
    return c.json({ message: 'WebSocket upgrade required.' }, 400);
  }
  websocketUpgrade.context = c.get('lowdefyContext');
  return c.json({ ok: true });
}

export default websocketHandler;
