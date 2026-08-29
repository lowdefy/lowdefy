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
import handleControl from './control/handleControl.js';
import handleEndpointCall from './handleEndpointCall.js';
import handleRenderNotification from './handleRenderNotification.js';
import handleRequest from './handleRequest.js';
import handleValidateSchema from './handleValidateSchema.js';

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
