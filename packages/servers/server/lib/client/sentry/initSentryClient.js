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

import * as Sentry from '@sentry/browser';

let initialized = false;

// Header and query parameter names that carry the client's address or identity, by substring.
// Sentry already filters names holding auth, token, session, key, cookie and similar.
const identifyingNames = ['forwarded', '-ip', 'remote-', 'via', '-user'];

// What the browser SDK collects, pinned to what Sentry 10 sent with sendDefaultPii off: Sentry 11
// defaults to sending cookies, request and response bodies, and lets Sentry read the user's IP
// address from each upload. The server SDK pins the same (lib/server/sentry/sentryDataCollection).
const dataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { deny: identifyingNames },
  httpBodies: [],
  urlQueryParams: { deny: identifyingNames },
};

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
    dataCollection,
    // Sentry 11 attaches a stack trace to captured messages by default, which groups them into
    // new issues; Lowdefy keeps the grouping it had.
    attachStacktrace: false,
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
