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

import { type } from '@lowdefy/helpers';

import detachRequestSignal from './detachRequestSignal.js';
import logEndpointCompleted from './logEndpointCompleted.js';

// Run work after the response is sent. Platforms that reap the invocation once
// the response is flushed (Vercel fluid compute) inject context.waitUntil in
// their server's apiContext middleware to keep the invocation alive until the
// promise settles (bounded by the function's maxDuration); locally /
// self-hosted there is no waitUntil and the promise simply runs detached on
// the still-alive Node process.
//
// The outcome only exists in logs — completion and failure are logged through
// the request logger so they reach the platform log stream (and any log
// drains); a background failure must never surface as an unhandled rejection.
//
// When the background work is an endpoint routine, the caller passes its
// `endpointConfig`: the synchronous path emits `endpoint_completed` after the
// routine returns, but an `async: true` run has already answered its caller by
// then, so this is the only place its wide event can be emitted. Without it an
// async endpoint is invisible to every endpoint_completed query. A background
// dispatch (a detached call) passes no config - the endpoint it dispatches to
// emits its own event in its own invocation.
function scheduleBackground(context, { endpointConfig, event, endpointId }, fn) {
  const { logger } = context;
  // The response has been sent (or is about to be): the request's abort signal
  // no longer describes this work.
  detachRequestSignal(context);
  const startTime = performance.now();
  const promise = (async () => {
    try {
      const result = await fn();
      logger.info({ event: `${event}_done`, endpointId, status: result?.status });
      if (!type.isNone(endpointConfig)) {
        logEndpointCompleted(context, {
          endpointConfig,
          entry: 'background',
          error: result?.error,
          startTime,
          status: result?.status,
        });
      }
    } catch (err) {
      logger.error({ event: `${event}_failed`, endpointId, err }, err.message);
      if (!type.isNone(endpointConfig)) {
        logEndpointCompleted(context, {
          endpointConfig,
          entry: 'background',
          error: err,
          startTime,
          status: 'error',
        });
      }
    }
  })();
  if (context.waitUntil) {
    context.waitUntil(promise);
  }
  return promise;
}

export default scheduleBackground;
