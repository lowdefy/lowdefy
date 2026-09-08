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

import addStepResult from './addStepResult.js';
import invokeEndpoint from './invokeEndpoint.js';
import scheduleBackground from './scheduleBackground.js';

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
    state: routineContext.state,
    steps: routineContext.steps,
  });

  // detached: true — fire-and-forget the call back through the deployment's
  // /api/detached route, so the target runs in its OWN function invocation
  // with a fresh duration budget (chainable bounded work without a queue).
  // At-most-once, no retry: targets must be idempotent. The dispatch promise
  // rides the platform request context so the outgoing request always leaves
  // before the invocation is reaped; the target's own outcome exists only in
  // its logs and whatever its routine writes.
  if (evaluatedProperties.detached === true) {
    if (!process.env.CRON_SECRET) {
      throw new ConfigError(
        'CallApi with "detached: true" requires the CRON_SECRET environment variable — the /api/detached route fails closed without it.'
      );
    }
    if (!context.origin) {
      throw new ConfigError('Detached endpoint calls require the request origin on context.');
    }
    const targetEndpointId = evaluatedProperties.endpointId;
    scheduleBackground(context, { event: 'detached_dispatch', endpointId: targetEndpointId }, () =>
      fetch(`${context.origin}/api/detached/${targetEndpointId}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          payload: serializer.serialize(evaluatedProperties.payload ?? {}),
        }),
      })
    );
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

  const result = await invokeEndpoint(context, {
    endpointId: evaluatedProperties.endpointId,
    payload: evaluatedProperties.payload,
    endpointDepth: routineContext.endpointDepth,
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
    response,
  });

  return { status: 'continue' };
}

export default handleEndpointCall;
