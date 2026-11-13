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

import sentrySdk from '../../lib/server/sentry/sentrySdk.js';

// Sentry's Http integration gives a request an isolation scope of its own when Node emits the
// server's request event. A WebSocket upgrade arrives on the upgrade event instead, which
// @hono/node-server runs through the app (on the Node server and the Vercel function alike), so
// without this it runs in the process-wide default scope: the Sentry middleware would put the
// upgrade's credential scrub where every socket and every upgrade shares it. Each upgrade gets a
// scope of its own here, before the Sentry middleware, and the websocket route keeps running the
// socket's events in it. A request Node emits as a request event already has its own scope, the
// one its root http.server span captured, and is left in it, so the upgrade test is Node's own:
// an Upgrade header with "upgrade" among the Connection header's tokens.
function isUpgrade(c) {
  const connectionTokens = (c.req.header('connection') ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase());
  return (
    c.req.header('upgrade')?.toLowerCase() === 'websocket' && connectionTokens.includes('upgrade')
  );
}

function upgradeIsolationScope() {
  return function isolateUpgrade(c, next) {
    const Sentry = sentrySdk.current;
    if (!Sentry || !isUpgrade(c)) {
      return next();
    }
    return Sentry.withIsolationScope(() => next());
  };
}

export default upgradeIsolationScope;
