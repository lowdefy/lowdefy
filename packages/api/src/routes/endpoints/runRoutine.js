/*
  Copyright 2020-2024 Lowdefy, Inc

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
import callRequest from './callRequest.js';

import controlHandlers from './control/controlHandlers.js';

async function handleRequest(context, { request }, { blockId, pageId, payload }) {
  const requestResult = await callRequest(context, {
    blockId,
    pageId,
    payload,
    requestId: request.requestId,
    request,
  });
  context.logger.debug({
    event: 'debug_start_request',
    request,
  });
  return requestResult;
}

async function handleControl(context, { control }) {
  for (const [key, handler] of Object.entries(controlHandlers)) {
    if (key in control) {
      return await handler(context, { control });
    }
  }
  throw new Error('Unexpected control.', { cause: control });
}

async function runRoutine(context, { routine }, endpoint) {
  if (type.isObject(routine)) {
    if (routine.id?.startsWith?.('request:')) {
      await handleRequest(context, { request: routine }, endpoint);
      return { status: 'continue' };
    }
    return await handleControl(context, { control: routine });
  }
  if (type.isArray(routine)) {
    for (const item of routine) {
      const res = await runRoutine(context, { routine: item });
      if (['return', 'error', 'reject'].includes(res.status)) {
        return res;
      }
    }
    return { status: 'continue' };
  }
  throw new Error('Invalid routine', { cause: { routine } });
}

export default runRoutine;
