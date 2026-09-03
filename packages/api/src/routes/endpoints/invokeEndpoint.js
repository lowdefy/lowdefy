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

import { ConfigError } from '@lowdefy/errors';

import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import getEndpointConfig from './getEndpointConfig.js';
import logEndpointCompleted from './logEndpointCompleted.js';
import resolveRunAs from './resolveRunAs.js';
import runRoutine from './runRoutine.js';
import validateEndpointResponse from './validateEndpointResponse.js';
import validatePayload from './validatePayload.js';

async function invokeEndpoint(context, { endpointId, payload, endpointDepth }) {
  if (endpointDepth >= 10) {
    throw new ConfigError(
      'Endpoint call depth exceeded maximum of 10. Check for recursive endpoint calls.'
    );
  }

  const endpointConfig = await getEndpointConfig(context, { endpointId });
  authorizeApiEndpoint(context, { endpointConfig });

  const childPayload = payload ?? {};
  validatePayload({ endpointConfig, payload: childPayload });

  const childRoutineContext = {
    steps: {},
    payload: childPayload,
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: endpointDepth + 1,
  };
  // The child endpoint's own runAs declaration, evaluated in the child's fresh
  // context - not the parent's scope. Like the caller identity, the parent's
  // runAs does not flow into a CallApi child: each endpoint declares the
  // organization it runs as, so the same endpoint is scoped identically over
  // every transport.
  childRoutineContext.runAs = resolveRunAs(context, childRoutineContext, {
    runAs: endpointConfig.runAs,
    location: endpointId,
    configKey: endpointConfig['~k'],
    source: 'endpoint',
  });

  const startTime = performance.now();
  const result = await runRoutine(context, childRoutineContext, {
    routine: endpointConfig.routine,
  });
  logEndpointCompleted(context, {
    endpointConfig,
    entry: 'call_api',
    error: result.error,
    startTime,
    status: result.status,
  });
  if (result.status === 'return') {
    validateEndpointResponse(context, { endpointConfig, response: result.response });
  }
  return result;
}

export default invokeEndpoint;
