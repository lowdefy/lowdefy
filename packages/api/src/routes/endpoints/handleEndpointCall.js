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
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import addStepResult from './addStepResult.js';
import createBoundSystemContext from '../../context/createBoundSystemContext.js';
import evaluateRoutineOperators from './evaluateRoutineOperators.js';
import invokeEndpoint from './invokeEndpoint.js';
import resolveCallBinding from './resolveCallBinding.js';
import scheduleBackground from './scheduleBackground.js';

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
      throw new LowdefyInternalError(
        'Detached endpoint calls require the request origin on context.'
      );
    }
    const targetEndpointId = evaluatedProperties.endpointId;
    scheduleBackground(context, { event: 'detached_dispatch', endpointId: targetEndpointId }, () =>
      fetch(`${context.origin}/api/detached/${targetEndpointId}`, {
        method: 'POST',
        headers: {
          // The dev server's journey cookies (data set, mutant) ride the hop
          // so the target runs in the same journey run; the production server
          // sets none. Spread first so content-type and authorization win.
          ...(context.loopbackHeaders ?? {}),
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        // Carry the already-resolved dispatcher identity across the hop
        // (Decision 4): a detached call is a fresh invocation, not a fresh
        // principal. The receiver rehydrates context.user / context.system from
        // this snapshot and authorizes nested calls against it through the
        // normal path - so a user-dispatched detached run reaches nothing the
        // user could not reach synchronously, and a cron/hook/verified-webhook
        // run blanket-passes like its dispatcher. Built server-side from the
        // resolved context, never from user input; the CRON_SECRET proves
        // origin, which is what lets the receiver trust the assertion.
        body: JSON.stringify({
          payload: serializer.serialize(evaluatedProperties.payload ?? {}),
          principal: {
            user: serializer.serialize(callContext.user ?? null),
            system: callContext.system === true,
            organizationId: callContext.boundOrganizationId ?? null,
            agent: routineContext.agent ?? null,
          },
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

  const result = await invokeEndpoint(callContext, {
    agent: routineContext.agent,
    endpointId: evaluatedProperties.endpointId,
    payload: evaluatedProperties.payload,
    endpointDepth: routineContext.endpointDepth,
    caught: routineContext.caught === true,
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
