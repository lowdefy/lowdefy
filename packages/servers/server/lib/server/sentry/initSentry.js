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

import loggerConfig from '../../build/logger.js';
import scrubEvent from './scrubEvent.js';
import sentrySdk from './sentrySdk.js';

// Starts Sentry and returns its SDK, or null when Sentry is off. Nothing Sentry is imported when
// it is off. A server that traces requests runs @sentry/node, which sets up OpenTelemetry and
// hooks every module the app imports after it. A server that only reports errors runs the SDK's
// light mode, which has neither: on a serverless function that start-up cost lands on every cold
// start, so serverless functions report errors only unless logger.sentry.serverTracing is true.
// This module runs before the logger exists, so the caller logs that Sentry is on.
async function initSentryServer({ serverless = false } = {}) {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  const sentryConfig = loggerConfig.sentry ?? {};

  if (sentryConfig.server === false) {
    return null;
  }

  const tracing = sentryConfig.serverTracing ?? !serverless;
  const options = {
    dsn: process.env.SENTRY_DSN,
    environment: sentryConfig.environment || process.env.NODE_ENV || 'production',
    // A serverless function stays busy until the flush after each request ends, and the SDK
    // sends a client report (a count of dropped and unsampled events) with every flush that has
    // one, so each request would wait on an upload. A long-running server sends them on a timer.
    sendClientReports: !serverless,
    // Every path out to Sentry gets the log's secret scrub: error events with their cause
    // chain, and the spans and breadcrumbs that carry outgoing URLs with their query strings.
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeSendSpan: (span) => scrubEvent(span),
    beforeBreadcrumb: (breadcrumb) => scrubEvent(breadcrumb),
  };

  // Incoming request bodies are attached to error events by default - an endpoint payload,
  // a sign-in password - and no value scrub can recognise them. Each SDK's Http integration is
  // passed by name, replacing its default one rather than adding a second.
  let Sentry;
  if (tracing) {
    Sentry = await import('@sentry/node');
    Sentry.init({
      ...options,
      tracesSampleRate: sentryConfig.tracesSampleRate ?? 0.1,
      integrations: [Sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' })],
    });
  } else {
    Sentry = await import('@sentry/node-core/light');
    Sentry.init({
      ...options,
      integrations: [Sentry.httpIntegration({ maxRequestBodySize: 'none' })],
    });
  }

  sentrySdk.current = Sentry;
  return Sentry;
}

export default initSentryServer;
export { initSentryServer };
