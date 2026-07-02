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

import invokeEndpoint from '../../endpoints/invokeEndpoint.js';
import authHookPoints from './authHookPoints.js';

// Runs a user hook: builds the point's payload from the hook data, builds a
// fresh system context, and invokes the bound InternalApi endpoint. Returns
// the routine's terminal envelope ({ status, response?, error? }); the
// translation to BetterAuth's hook contract lives in createUserBeforeHook /
// createUserAfterHook.
function createHookDispatch({ createSystemContext, hook }) {
  const { buildPayload } = authHookPoints[hook.point];
  return async function dispatchHook(data, ctx) {
    const start = performance.now();
    const payload = await buildPayload(data, ctx);
    const context = createSystemContext();
    const result = await invokeEndpoint(context, {
      endpointId: hook.endpointId,
      payload,
      endpointDepth: 0,
    });
    context.logger.debug({
      event: 'debug_auth_hook',
      hookId: hook.id,
      point: hook.point,
      endpointId: hook.endpointId,
      status: result.status,
      elapsed_ms: Math.round((performance.now() - start) * 100) / 100,
    });
    return result;
  };
}

export default createHookDispatch;
