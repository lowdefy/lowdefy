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

import checkEnvironmentGuards from '@lowdefy/node-utils/checkEnvironmentGuards.js';

import initSentryServer from '../lib/server/sentry/initSentry.js';

// The startup every production entry runs before it serves: the Node server (src/index.js) and the
// Vercel function entry that `lowdefy vercel-output` generates. Keeping it in one place stops the
// entries drifting apart. The build artifacts are read relative to process.cwd(), so an entry that
// has to change directory imports this module dynamically, after the chdir.
async function initServer() {
  // Auth.js v5 reads AUTH_URL but not NEXTAUTH_URL — alias the v4 variable
  // before any auth config loads so existing deployments keep working.
  if (process.env.NEXTAUTH_URL && !process.env.AUTH_URL) {
    process.env.AUTH_URL = process.env.NEXTAUTH_URL;
  }

  const sentryEnabled = initSentryServer();

  // Import after Sentry init so instrumentation observes the module graph.
  const { default: createApp } = await import('./app.js');
  const { default: createLogger } = await import('../lib/server/log/createLogger.js');
  const { default: config } = await import('../lib/build/config.js');

  // The build checked the current environment's guards, but an image built once can be started
  // with different variables, so they are checked again before the server takes any traffic.
  checkEnvironmentGuards({
    name: config.environment,
    guards: config.environments?.[config.environment]?.guards,
  });

  const logger = createLogger({ server: 'lowdefy' });
  if (sentryEnabled) {
    logger.info('Sentry enabled: server');
  }

  return { createApp, logger, sentryEnabled };
}

export default initServer;
