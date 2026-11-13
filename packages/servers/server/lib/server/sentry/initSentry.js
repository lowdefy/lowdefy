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
import scrubSpan from './scrubSpan.js';
import sentryDataCollection from './sentryDataCollection.js';
import sentrySdk from './sentrySdk.js';
import trackSpanCredentialScrubs from './trackSpanCredentialScrubs.js';

// Sentry's Hono integration names the request's span and captures every error that reaches the
// app's error handler, untagged and marked unhandled. Lowdefy names the span itself (the Sentry
// middleware) and captures from the error handler with its own tags, so it is left out.
function withoutHonoIntegration(defaultIntegrations) {
  return defaultIntegrations.filter(({ name }) => name !== 'Hono');
}

// Starts Sentry and returns its SDK, or null when Sentry is off. Nothing Sentry is imported when
// it is off. A server that traces requests streams a span for each request and for the work it
// does (outgoing fetches, database calls). A serverless function reports errors only unless
// logger.sentry.serverTracing is true: it stays busy, and billed, until a request's sampled spans
// have been uploaded.
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

  // Sentry installs module hooks that let its library integrations (Hono, mongodb, pg and
  // others) see those libraries load; they only make spans. On a serverless function they cost
  // ~35 ms per cold start (measured on Vercel, Sentry 11.12) and wrap only Hono, whose
  // integration Lowdefy leaves out, so they are off there, tracing or not. The Http integration,
  // which traces requests and reports errors with their request, needs no hooks.
  const enableRuntimeChannelInjection = !serverless;

  const Sentry = await import('@sentry/node');
  const client = Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: sentryConfig.environment || process.env.NODE_ENV || 'production',
    ...(tracing ? { tracesSampleRate: sentryConfig.tracesSampleRate ?? 0.1 } : {}),
    enableRuntimeChannelInjection,
    dataCollection: sentryDataCollection,
    // Sentry 11 attaches a stack trace to captured messages by default, which groups them into
    // new issues; Lowdefy keeps the grouping it had.
    attachStacktrace: false,
    // A serverless function stays busy until the flush after each request ends, and the SDK
    // sends a client report (a count of dropped and unsampled events) with every flush that has
    // one, so each request would wait on an upload. A long-running server sends them on a timer.
    sendClientReports: !serverless,
    // Every path out to Sentry gets the log's secret scrub: error events with their cause
    // chain, the streamed spans that carry outgoing URLs with their query strings, and
    // breadcrumbs.
    beforeSend: (event) => scrubEvent(event),
    beforeSendSpan: scrubSpan,
    beforeBreadcrumb: (breadcrumb) => scrubEvent(breadcrumb),
    // Incoming request bodies are attached to error events and spans - an endpoint payload, a
    // sign-in password - and no value scrub can recognise them. The Http integration is passed
    // by name, replacing its default one rather than adding a second.
    integrations: (defaultIntegrations) => [
      ...withoutHonoIntegration(defaultIntegrations),
      Sentry.httpIntegration({ maxRequestBodySize: 'none' }),
    ],
  });

  if (tracing) {
    const { getCapturedScopesOnSpan } = await import('@sentry/core');
    trackSpanCredentialScrubs({ client, getCapturedScopesOnSpan });
  }

  sentrySdk.current = Sentry;
  return Sentry;
}

export default initSentryServer;
export { initSentryServer };
