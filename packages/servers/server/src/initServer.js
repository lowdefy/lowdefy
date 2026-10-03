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

import * as Sentry from '@sentry/node';

import checkEnvironmentGuards from '@lowdefy/node-utils/checkEnvironmentGuards.js';

import initSentryServer from '../lib/server/sentry/initSentry.js';

// The startup every production entry runs before it serves: the Node server (src/index.js) and the
// Vercel function entry that `lowdefy vercel-output` generates. Keeping it in one place stops the
// entries drifting apart. The build artifacts are read relative to process.cwd(), so an entry that
// has to change directory imports this module dynamically, after the chdir.
async function initServer() {
  const sentryEnabled = initSentryServer();

  // The build checked the current environment's guards, but an image built once can be started
  // with different variables, so they are checked again before the server takes any traffic — and
  // before the app loads, so a misconfigured start fails without importing every plugin under the
  // wrong variables. The failure is sent to Sentry here because the Vercel launcher catches errors
  // thrown while it imports the function entry, so no global handler would report it, and the
  // instance can be torn down before a queued event is sent.
  const { default: config } = await import('../lib/build/config.js');
  try {
    checkEnvironmentGuards({
      name: config.environment,
      guards: config.environments?.[config.environment]?.guards,
    });
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }

  // Import after Sentry init so instrumentation observes the module graph.
  const { default: createApp } = await import('./app.js');
  const { default: createLogger } = await import('../lib/server/log/createLogger.js');

  const logger = createLogger({ server: 'lowdefy' });
  if (sentryEnabled) {
    logger.info('Sentry enabled: server');
  }

  return { createApp, logger, sentryEnabled };
}

export default initServer;
