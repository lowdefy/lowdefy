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

import { serializer } from '@lowdefy/helpers';

import applySystemTrust from '../../context/applySystemTrust.js';
import buildEndpointResult from '../../response/buildEndpointResult.js';
import createAuthorizeOutcome from '../../context/createAuthorizeOutcome.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import detachRequestSignal from './detachRequestSignal.js';
import getEndpointConfig from './getEndpointConfig.js';
import logEndpointCompleted from './logEndpointCompleted.js';
import resolveRunAs from './resolveRunAs.js';
import runRoutine from './runRoutine.js';

// Runs an endpoint invoked through the detached route (a CallApi step with
// `detached: true` fire-and-forgets an HTTP call back to the deployment, so the
// target runs in its OWN function invocation with a fresh duration budget).
// The transport is authorized by CRON_SECRET, which proves the loopback request
// originated from the deployment (an ORIGIN proof, not an identity). A detached
// call is a fresh invocation, not a fresh principal (Decision 4): it runs with
// the SAME identity the dispatching run had, carried across the hop and
// rehydrated here. There is no detached-specific authorization rule - nested
// calls flow through the normal `authorizeOutcome` path against the carried identity.
// Payload arrives serialized (dates etc. survive the HTTP hop via
// @lowdefy/helpers serializer).
async function runDetachedEndpoint(context, { endpointId, payload, principal }) {
  const { logger } = context;

  detachRequestSignal(context);

  context.endpointId = endpointId;

  // Rehydrate the dispatcher's identity carried across the CRON_SECRET-gated
  // hop BEFORE deriving authorizeOutcome and evaluateOperators, so both the auth check
  // and the `_user` operator see the carried identity. This is a sanctioned
  // substitute writer for resolveAuthentication - the principal was resolved
  // upstream and built server-side, never from user input. A stale principal
  // (roles changed between dispatch and run) is acceptable for at-most-once
  // fire-and-forget - no re-resolution.
  if (principal?.system === true) {
    // The dispatcher was a trusted system context (cron, hook, or a verified
    // webhook) - the detached run inherits it and blanket-passes.
    applySystemTrust(context);
  } else {
    // The dispatcher was a real user (or a strategy caller) - carry that
    // identity. This is NOT a system context (context.system stays unset), so
    // nested authorization is re-checked against these roles exactly as it
    // would be in-invocation - the run reaches nothing the dispatcher could not
    // reach synchronously.
    context.user = serializer.deserialize(principal?.user ?? null);
    context.authorizeOutcome = createAuthorizeOutcome(context);
  }
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_detached_endpoint', endpointId });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  const routineContext = {
    steps: {},
    payload: serializer.deserialize(payload ?? {}),
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
    entry: 'detached',
    error,
    startTime,
    status,
  });

  return buildEndpointResult(context, { error, response, status });
}

export default runDetachedEndpoint;
