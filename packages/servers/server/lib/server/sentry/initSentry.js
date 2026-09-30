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

import loggerConfig from '../../build/logger.js';
import scrubEvent from './scrubEvent.js';

// Returns true when Sentry was initialized, so the caller can log it through
// the structured logger — this module runs before the logger exists.
function initSentryServer() {
  // No-op if SENTRY_DSN not set
  if (!process.env.SENTRY_DSN) {
    return false;
  }

  const sentryConfig = loggerConfig.sentry || {};

  // No-op if server logging is explicitly disabled
  if (sentryConfig.server === false) {
    return false;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: sentryConfig.environment || process.env.NODE_ENV || 'production',
    tracesSampleRate: sentryConfig.tracesSampleRate ?? 0.1,
    // Every path out to Sentry gets the log's secret scrub: error events with their cause
    // chain, and the spans and breadcrumbs that carry outgoing URLs with their query strings.
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeSendSpan: (span) => scrubEvent(span),
    beforeBreadcrumb: (breadcrumb) => scrubEvent(breadcrumb),
    // Incoming request bodies are attached to error events by default - an endpoint payload,
    // a sign-in password - and no value scrub can recognise them. This replaces the default
    // Http integration by name rather than adding a second one.
    integrations: [Sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' })],
  });

  return true;
}

export default initSentryServer;
export { initSentryServer };
