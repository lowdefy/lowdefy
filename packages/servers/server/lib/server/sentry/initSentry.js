/*
  Copyright 2020-2024 Lowdefy, Inc

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

import * as Sentry from '@sentry/nextjs';

function loadLoggerConfig() {
  try {
    // Dynamic require to handle missing file gracefully
    return require('../../../build/logger.json');
  } catch {
    return {};
  }
}

function initSentryServer() {
  // No-op if SENTRY_DSN not set
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const loggerConfig = loadLoggerConfig();
  const sentryConfig = loggerConfig.sentry || {};

  // No-op if server logging is explicitly disabled
  if (sentryConfig.server === false) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: sentryConfig.environment || process.env.NODE_ENV || 'production',
    tracesSampleRate: sentryConfig.tracesSampleRate ?? 0.1,
  });

  console.log('Sentry enabled: server');
}

export default initSentryServer;
export { initSentryServer };
