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
import { ConfigError } from '@lowdefy/errors';

import applySystemTrust from '../../context/applySystemTrust.js';
import buildEndpointResult from '../../response/buildEndpointResult.js';
import createAuthorizeOutcome from '../../context/createAuthorizeOutcome.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import detachRequestSignal from './detachRequestSignal.js';
import getEndpointConfig from './getEndpointConfig.js';
import logEndpointCompleted from './logEndpointCompleted.js';
import resolveRunAs from './resolveRunAs.js';
import runRoutine from './runRoutine.js';
import runWebhookVerify from './runWebhookVerify.js';

// Runs an endpoint declared `webhook` — a third-party webhook receiver
// (SNS, Event Grid, Stripe, ...) served on the standard /api/endpoints route,
// but taking the request RAW: bodies are the caller's own format, not
// Lowdefy's { payload } envelope, so the routine receives
// { body, query, headers } as its payload and its return value is sent back
// verbatim (handshakes require exact response shapes). Only endpoints that
// opt in are runnable here (a missing flag reads as a missing endpoint — no
// probing).
//
// The transport is public by design, so the run starts caller-less AND
// UNTRUSTED (Decision 3): context.user = null, context.system unset. It earns
// trust only when its declared `webhook.verify` gate passes, run mechanically
// BEFORE the routine body - so verification can never be forgotten, mis-ordered,
// or placed after a privileged CallApi. A webhook with no declared verifier
// runs untrusted throughout, so any nested protected CallApi fails closed.
async function runWebhookEndpoint(context, { endpointId, body, query, headers }) {
  const { logger } = context;

  detachRequestSignal(context);
  context.endpointId = endpointId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_webhook_endpoint', endpointId });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  // webhook may be `true` or a `{ verify }` object — gate on truthiness.
  if (!endpointConfig.webhook) {
    const err = new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }

  // Caller-less and UNTRUSTED: with context.system unset, createAuthorizeOutcome
  // fails closed on any protected target exactly as an unauthenticated call would
  // (Api and InternalApi alike — InternalApi is an HTTP-exposure choice, not a
  // trust tier, so it earns no special pass).
  context.user = null;
  context.authorizeOutcome = createAuthorizeOutcome(context);

  // A declared verifier is the only thing that can make the run trusted, and it
  // runs before any routine step. On success the runner (not routine or
  // resolver code) sets context.system, matching the state createSystemContext
  // produces for cron. On failure the routine never runs.
  const verify = type.isObject(endpointConfig.webhook) ? endpointConfig.webhook.verify : undefined;
  if (!type.isNone(verify)) {
    const verified = await runWebhookVerify(context, { verify, body, query, headers });
    if (!verified) {
      logger.warn({ event: 'webhook_verify_failed', endpointId });
      return {
        error: null,
        response: null,
        status: 'unauthorized',
        success: false,
      };
    }
    applySystemTrust(context);
  }

  const routineContext = {
    steps: {},
    payload: { body: body ?? null, query: query ?? {}, headers: headers ?? {} },
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };
  // The endpoint's runAs scopes every walled step of this run (a step-level
  // runAs overrides it). Resolved against the fresh routine context, so it can
  // read _user, _secret or a literal, never a step result or the payload.
  routineContext.runAs = resolveRunAs(context, routineContext, {
    runAs: endpointConfig.runAs,
    location: endpointId,
    configKey: endpointConfig['~k'],
    source: 'endpoint',
  });

  const startTime = performance.now();
  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });
  logEndpointCompleted(context, {
    endpointConfig,
    entry: 'webhook',
    error,
    startTime,
    status,
  });

  return buildEndpointResult(context, { error, response, status });
}

export default runWebhookEndpoint;
