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

import { serve } from '@hono/node-server';
import * as Sentry from '@sentry/node';
import { WebSocketServer } from 'ws';

import initSentryServer from '../lib/server/sentry/initSentry.js';

const sentryEnabled = initSentryServer();

// Import after Sentry init so instrumentation observes the module graph.
const { default: createApp } = await import('./app.js');
const { default: createLogger } = await import('../lib/server/log/createLogger.js');
const { default: appMeta } = await import('../lib/build/appMeta.js');
const { default: createChatBot, stopChatBot } = await import(
  '../lib/server/channels/createChatBot.js'
);

const app = createApp();
const logger = createLogger({ server: 'lowdefy' });
const port = Number(process.env.PORT ?? 3000);

if (sentryEnabled) {
  logger.info('Sentry enabled: server');
}

// Handles /api/websocket upgrades via serve({ websocket }). 256 KiB max frame,
// aligned with Vercel's documented default for WebSocket functions.
const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });

const server = serve({ fetch: app.fetch, port, websocket: { server: wss } }, (info) => {
  // lowdefy_version logs once here rather than on every line — it is implied
  // by the build, unlike the per-line deploy identity fields on the logger.
  logger.info(
    { port: info.port, lowdefy_version: appMeta.lowdefyVersion },
    `Lowdefy server listening on http://localhost:${info.port}`
  );
});

// Start the channel bot (no-op when channels are unconfigured) so webhook
// handlers are registered at boot and config errors fail startup, mirroring
// the eager auth construction in createApp.
await createChatBot({ logger });

// Container runtimes send SIGTERM and escalate to SIGKILL after a grace period
// (Docker defaults to 10s) — finish in-flight work and exit before that deadline.
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  // 1001 "going away" — clients reconnect and resubscribe on their own.
  for (const client of wss.clients) {
    client.close(1001, 'Server shutting down');
  }
  // Stop channel polling adapters (webhook mode is a no-op).
  stopChatBot();
  // Drop idle keep-alive connections so close() only waits on in-flight requests.
  server.closeIdleConnections?.();
  server.close(() => {
    // Flush queued Sentry events; resolves immediately when Sentry is not enabled.
    Sentry.close(2000).finally(() => process.exit(0));
  });
  // In-flight requests that outlive the grace period would otherwise hold the
  // process open until SIGKILL — exit first so shutdown stays clean.
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Vercel's Node.js builder consumes the exported server — the same pattern
// Vercel documents for WebSocket support with Hono on Fluid compute.
export default server;
