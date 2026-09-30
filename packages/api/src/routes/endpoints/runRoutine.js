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

import handleAgentCall from './handleAgentCall.js';
import handleAuthStep from './handleAuthStep.js';
import handleDescribeDynamicPolicy from './handleDescribeDynamicPolicy.js';
import handleControl from './control/handleControl.js';
import handleEndpointCall from './handleEndpointCall.js';
import handleRenderNotification from './handleRenderNotification.js';
import handleRequest from './handleRequest.js';
import handleValidateDynamic from './handleValidateDynamic.js';
import handleValidateSchema from './handleValidateSchema.js';

// Errors a :catch can handle as an outcome of the call, not a fault in the app: a request or
// provider that failed or found nothing, an external service that did not answer, and author
// errors meant for the user. Config, operator and internal errors are faults even when caught.
const expectedCaughtErrorNames = new Set(['RequestError', 'ServiceError', 'UserError']);

async function runRoutine(context, routineContext, { routine }) {
  try {
    if (type.isObject(routine)) {
      if (routine.id?.startsWith?.('request:')) {
        return await handleRequest(context, routineContext, {
          request: routine,
        });
      }
      if (routine.id?.startsWith?.('endpoint:')) {
        return await handleEndpointCall(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('validateDynamic:')) {
        return await handleValidateDynamic(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('describeDynamic:')) {
        return await handleDescribeDynamicPolicy(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('validate:')) {
        return await handleValidateSchema(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('agent:')) {
        return await handleAgentCall(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('auth:')) {
        return await handleAuthStep(context, routineContext, {
          step: routine,
        });
      }
      if (routine.id?.startsWith?.('notification:')) {
        return await handleRenderNotification(context, routineContext, {
          step: routine,
        });
      }
      return await handleControl(context, routineContext, { control: routine });
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
    if (error.isReject) {
      return { status: 'reject', error };
    }
    // An expected error inside a :try with a :catch is handled by that :catch, so it is logged
    // once, at debug (a provider's 404 in a waterfall is not a fault). The :catch can still
    // rethrow it. Any other caught error still goes to handleError below, so its config location
    // is resolved and it reaches the dev error feed and error tracking; the :catch runs as well.
    if (routineContext.caught === true && expectedCaughtErrorNames.has(error.name)) {
      if (!error.handled) {
        context.logger.debug({ event: 'debug_routine_caught_error', err: error }, error.message);
        error.handled = true;
      }
      return { status: 'error', error };
    }
    // A UserError is an expected outcome, not a fault: it is logged once, as a
    // warning. A step or control that logs one marks it handled; one thrown
    // without being logged, such as a nested CallApi whose payload the target's
    // payloadSchema refuses, is logged here.
    if (error.name === 'UserError') {
      if (!error.handled) {
        context.logger.warn({ event: 'warn_routine_user_error', err: error }, error.message);
        error.handled = true;
      }
      return { status: 'error', error };
    }
    // handleError sets error.handled once it has logged, so a nested runRoutine
    // re-throwing this error does not log it again.
    if (!error.handled) {
      await context.handleError(error);
    }
    return { status: 'error', error };
  }
}

export default runRoutine;
