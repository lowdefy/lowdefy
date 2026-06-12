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

import initSentryServer from '../lib/server/sentry/initSentry.js';

// Auth.js v5 reads AUTH_URL but not NEXTAUTH_URL — alias the v4 variable
// before any auth config loads so existing deployments keep working.
if (process.env.NEXTAUTH_URL && !process.env.AUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

initSentryServer();

// Import after Sentry init so instrumentation observes the module graph.
const { default: createApp } = await import('./app.js');

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Lowdefy server listening on http://localhost:${info.port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
