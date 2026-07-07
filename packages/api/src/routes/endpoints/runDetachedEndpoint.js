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

import createAuthorize from '../../context/createAuthorize.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';

// Runs an endpoint invoked through the detached route (a CallApi step with
// `detached: true` fire-and-forgets an HTTP call back to the deployment, so the
// target runs in its OWN function invocation with a fresh duration budget).
// Like a cron run this is authorized by the transport layer (CRON_SECRET) and
// executes as a system context: no user session, `_user` resolves to undefined,
// and InternalApi endpoints are callable. Payload arrives serialized (dates
// etc. survive the HTTP hop via @lowdefy/helpers serializer).
async function runDetachedEndpoint(context, { endpointId, payload }) {
  const { logger } = context;

  context.endpointId = endpointId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_detached_endpoint', endpointId });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  // Force a system context regardless of any session cookie sent with the request.
  context.user = null;
  context.authorize = createAuthorize({ user: null });

  const routineContext = {
    steps: {},
    payload: serializer.deserialize(payload ?? {}),
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

export default runDetachedEndpoint;
