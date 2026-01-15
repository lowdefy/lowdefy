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

let initialized = false;

function initSentryClient({ sentryDsn, sentryConfig }) {
  // No-op if already initialized
  if (initialized) {
    return;
  }

  // No-op if SENTRY_DSN not set
  if (!sentryDsn) {
    return;
  }

  // No-op if client logging is explicitly disabled
  if (sentryConfig?.client === false) {
    return;
  }

  const config = sentryConfig || {};

  Sentry.init({
    dsn: sentryDsn,
    environment: config.environment || process.env.NODE_ENV || 'production',
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 0.1,
    integrations: [
      Sentry.replayIntegration(),
      ...(config.feedback ? [Sentry.feedbackIntegration({ colorScheme: 'system' })] : []),
    ],
  });

  initialized = true;
  console.log('Sentry enabled: client');
}

export default initSentryClient;
