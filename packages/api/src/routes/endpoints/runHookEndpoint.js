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
import { ConfigError } from '@lowdefy/errors';

import createAuthorize from '../../context/createAuthorize.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';

// Runs an endpoint invoked through the public /api/hooks route — the receiver
// for third-party webhooks (SNS, Event Grid, Stripe, ...), whose bodies are
// the caller's own format, not Lowdefy's { payload } envelope. Only endpoints
// that opt in with `hook: true` are reachable (a missing flag reads as a
// missing endpoint — no probing), and the routine receives
// { body, query, headers } as its payload. The transport is public by design:
// authenticating the caller (shared-secret query param, signature header) is
// the hook routine's own first step. Executes as a system context.
async function runHookEndpoint(context, { endpointId, body, query, headers }) {
  const { logger } = context;

  context.endpointId = endpointId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_hook_endpoint', endpointId });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  if (endpointConfig.hook !== true) {
    const err = new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }

  // Force a system context regardless of any session cookie sent with the request.
  context.session = undefined;
  context.user = undefined;
  context.authorize = createAuthorize({ session: undefined });

  const routineContext = {
    steps: {},
    payload: { body: body ?? null, query: query ?? {}, headers: headers ?? {} },
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };

  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });

  const success = !['error', 'reject'].includes(status);

  return {
    error: serializer.serialize(error),
    response: serializer.serialize(response),
    status: success ? 'success' : status,
    success,
  };
}

export default runHookEndpoint;
