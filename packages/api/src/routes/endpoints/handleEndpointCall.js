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

import addStepResult from './addStepResult.js';
import createBoundSystemContext from '../../context/createBoundSystemContext.js';
import evaluateRoutineOperators from './evaluateRoutineOperators.js';
import invokeEndpoint from './invokeEndpoint.js';
import resolveCallBinding from './resolveCallBinding.js';
import sendDetachedRequest from './sendDetachedRequest.js';

async function handleEndpointCall(context, routineContext, { step }) {
  const { logger } = context;

  logger.debug({
    event: 'debug_start_endpoint_call',
    step,
  });

  // Evaluate operators in step.properties (resolves endpointId, payload)
  const evaluatedProperties = evaluateRoutineOperators(context, routineContext, {
    input: step.properties,
    location: step.stepId,
  });

  // organization (and caller) bind the target to one organization as a system
  // run: the tenant wall filters and stamps with it, and `_user` is the named
  // stand-in caller, or null.
  const binding = resolveCallBinding(context, {
    caller: evaluatedProperties.caller,
    configKey: step['~k'],
    organization: evaluatedProperties.organization,
    stepId: step.stepId,
  });
  const callContext = binding === null ? context : createBoundSystemContext(context, binding);

  // detached: true — the target runs in its OWN invocation, never in this one. A server sends it
  // over its own /api/detached route (sendDetachedRequest); a host that runs no route, such as
  // @lowdefy/test-utils' test host, sets context.sendDetached to take the call itself. Either
  // way the caller carries on at once with the same step result.
  if (evaluatedProperties.detached === true) {
    const targetEndpointId = evaluatedProperties.endpointId;
    const sendDetached = context.sendDetached ?? sendDetachedRequest;
    sendDetached(context, {
      callContext,
      endpointId: targetEndpointId,
      payload: evaluatedProperties.payload ?? {},
      routineContext,
      step,
    });
    addStepResult(context, routineContext, {
      result: { detached: true, endpointId: targetEndpointId },
      stepId: step.stepId,
    });
    logger.debug({
      event: 'debug_end_endpoint_call',
      stepId: step.stepId,
      targetEndpointId,
      detached: true,
    });
    return { status: 'continue' };
  }

  const result = await invokeEndpoint(callContext, {
    agent: routineContext.agent,
    endpointId: evaluatedProperties.endpointId,
    payload: evaluatedProperties.payload,
    endpointDepth: routineContext.endpointDepth,
    caughtFaults: routineContext.caught === true ? routineContext.caughtFaults : null,
  });

  // Store the return value in the caller's steps
  const response = result.status === 'return' ? result.response : null;
  addStepResult(context, routineContext, {
    result: response,
    stepId: step.stepId,
  });

  // Propagate errors and rejects to the caller
  if (result.status === 'error' || result.status === 'reject') {
    return result;
  }

  logger.debug({
    event: 'debug_end_endpoint_call',
    stepId: step.stepId,
    targetEndpointId: evaluatedProperties.endpointId,
  });

  return { status: 'continue' };
}

export default handleEndpointCall;
