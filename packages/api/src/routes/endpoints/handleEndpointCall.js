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

import addStepResult from './addStepResult.js';
import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';

async function handleEndpointCall(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_endpoint_call',
    step,
  });

  // Evaluate operators in step.properties (resolves endpointId, payload)
  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    steps: routineContext.steps,
  });

  // Check recursion depth
  const currentDepth = routineContext.endpointDepth ?? 0;
  if (currentDepth >= 10) {
    throw new ConfigError(
      'Endpoint call depth exceeded maximum of 10. Check for recursive endpoint calls.'
    );
  }

  // Load target endpoint config
  const endpointConfig = await getEndpointConfig(context, {
    endpointId: evaluatedProperties.endpointId,
  });

  // Authorize current user against target endpoint
  authorizeApiEndpoint(context, { endpointConfig });

  // Create isolated routineContext for the called endpoint
  const childRoutineContext = {
    steps: {},
    payload: evaluatedProperties.payload ?? {},
    arrayIndices: [],
    items: {},
    endpointDepth: currentDepth + 1,
  };

  // Run the target endpoint's routine
  const result = await runRoutine(context, childRoutineContext, {
    routine: endpointConfig.routine,
  });

  // Store the return value in the caller's steps
  const response = result.status === 'return' ? result.response : null;
  addStepResult(context, routineContext, {
    result: response,
    stepId: step.stepId,
  });

  // Propagate errors
  if (result.status === 'error') {
    throw result.error ?? new Error('Endpoint call failed');
  }
  if (result.status === 'reject') {
    return result;
  }

  logger.debug({
    event: 'debug_end_endpoint_call',
    stepId: step.stepId,
    targetEndpointId: evaluatedProperties.endpointId,
    response,
  });

  return { status: 'continue' };
}

export default handleEndpointCall;
