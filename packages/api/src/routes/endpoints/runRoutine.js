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

import { type } from '@lowdefy/helpers';

import handleRequest from './handleRequest.js';
import handleControl from './control/handleControl.js';

async function runRoutine(context, routineContext, { routine }) {
  try {
    if (type.isObject(routine)) {
      if (routine.id?.startsWith?.('request:')) {
        return await handleRequest(context, routineContext, {
          request: routine,
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
    throw new Error('Invalid routine.', { cause: { routine } });
  } catch (error) {
    context.logger.error(error);
    return { status: 'error', error };
  }
}

export default runRoutine;
