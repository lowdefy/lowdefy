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

import { AuthorizationError, isExpectedError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import invokeEndpoint from '../endpoints/invokeEndpoint.js';

// Role rules decide who may hear a channel at all. A channel whose payload
// names a record also needs to know whether this subscriber may see that
// record, which only the app's own data can answer - so the websocket's check
// endpoint runs as the subscriber and must answer exactly true.
//
// Every refusal reads as a missing websocket, as a role refusal does
// (authorizeWebsocket), so a subscriber can not tell a record it may not see
// from a channel that does not exist.
async function checkWebsocketAccess(context, { payload, websocketConfig }) {
  const { check, websocketId } = websocketConfig;
  if (type.isNone(check)) {
    return;
  }
  const { logger } = context;

  let result;
  try {
    const checkPayload = type.isUndefined(check.payload)
      ? payload
      : context.evaluateOperators({
          input: check.payload,
          location: websocketId,
          payload,
          state: {},
          steps: {},
        });
    result = await invokeEndpoint(context, {
      endpointId: check.endpointId,
      payload: checkPayload,
      endpointDepth: 0,
    });
  } catch (error) {
    // The endpoint refusing the caller is a refusal like any other. Anything
    // else is a fault in the check's config or the endpoint, which the
    // developer needs to see; the subscriber is refused either way.
    if (isExpectedError(error)) {
      logger.debug({ event: 'debug_websocket_check_refused', websocketId, err: error });
    } else {
      if (error instanceof Object && type.isNone(error.configKey)) {
        error.configKey = check['~k'] ?? websocketConfig['~k'];
      }
      await context.handleError(error);
    }
    throw new AuthorizationError(`Websocket "${websocketId}" does not exist.`);
  }

  // A routine that errored was logged by runRoutine.
  if (result.status === 'return' && result.response === true) {
    logger.debug({ event: 'debug_websocket_check', websocketId, allowed: true });
    return;
  }
  logger.debug({
    event: 'debug_websocket_check',
    websocketId,
    allowed: false,
    status: result.status,
  });
  throw new AuthorizationError(`Websocket "${websocketId}" does not exist.`);
}

export default checkWebsocketAccess;
