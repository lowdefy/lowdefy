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

import { LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import checkAborted from './checkAborted.js';
import handleAgentCall from './handleAgentCall.js';
import handleAuthStep from './handleAuthStep.js';
import handleControl from './control/handleControl.js';
import handleEndpointCall from './handleEndpointCall.js';
import handleRenderNotification from './handleRenderNotification.js';
import handleRequest from './handleRequest.js';
import handleValidateSchema from './handleValidateSchema.js';
import logEvent from '../../log/logEvent.js';

// The identifiers of one built step. Only a step carries a stepId - a control
// (`:if`, `:for`, ...) is structure and emits no line of its own; the steps
// inside it do.
function stepEventFields({ context, routine, startTime }) {
  return {
    endpoint_id: routine.endpointId ?? context.endpointId,
    step_id: routine.stepId,
    step_type: routine.type,
    config_key: routine['~k'],
    duration_ms: Math.round(performance.now() - startTime),
  };
}

async function runRoutine(context, routineContext, { routine }) {
  const startTime = performance.now();
  try {
    checkAborted(context, { location: 'the next step' });
    if (type.isObject(routine)) {
      let result;
      if (routine.id?.startsWith?.('request:')) {
        result = await handleRequest(context, routineContext, {
          request: routine,
        });
      } else if (routine.id?.startsWith?.('endpoint:')) {
        result = await handleEndpointCall(context, routineContext, {
          step: routine,
        });
      } else if (routine.id?.startsWith?.('validate:')) {
        result = await handleValidateSchema(context, routineContext, {
          step: routine,
        });
      } else if (routine.id?.startsWith?.('agent:')) {
        result = await handleAgentCall(context, routineContext, {
          step: routine,
        });
      } else if (routine.id?.startsWith?.('auth:')) {
        result = await handleAuthStep(context, routineContext, {
          step: routine,
        });
      } else if (routine.id?.startsWith?.('notification:')) {
        result = await handleRenderNotification(context, routineContext, {
          step: routine,
        });
      } else {
        return await handleControl(context, routineContext, { control: routine });
      }
      logEvent({
        context,
        event: 'step_completed',
        fields: {
          ...stepEventFields({ context, routine, startTime }),
          status: result.status,
          success: !['error', 'reject'].includes(result.status),
        },
      });
      return result;
    }
    if (type.isArray(routine)) {
      for (const item of routine) {
        const res = await runRoutine(context, routineContext, {
          routine: item,
        });
        if (['return', 'error', 'reject'].includes(res.status)) {
          return res;
        }
      }
      return { status: 'continue' };
    }
    throw new LowdefyInternalError('Invalid routine.', { cause: { routine } });
  } catch (error) {
    if (!type.isNone(routine?.stepId)) {
      logEvent({
        context,
        event: 'step_failed',
        fields: {
          ...stepEventFields({ context, routine, startTime }),
          success: false,
          error,
        },
      });
    }
    if (error.isReject) {
      return { status: 'reject', error };
    }
    // A UserError raised by a nested :throw is an expected author outcome that
    // the calling routine already logged as a warning - it is not a fault.
    if (error.name === 'UserError') {
      return { status: 'error', error };
    }
    // handleError sets error.handled once it has logged - it is the single sink
    // that owns the flag, so a nested runRoutine re-throwing this error does not
    // log it again.
    if (!error.handled) {
      await context.handleError(error);
    }
    return { status: 'error', error };
  }
}

export default runRoutine;
