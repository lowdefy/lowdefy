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

import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import buildEndpointResult from '../../response/buildEndpointResult.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';
import scheduleBackground from './scheduleBackground.js';

async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const { logger } = context;

  context.blockId = blockId;
  context.endpointId = endpointId;
  context.pageId = pageId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_endpoint', blockId, endpointId, pageId, payload });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  // Block HTTP access to InternalApi endpoints — same error as missing endpoint
  if (endpointConfig.type === 'InternalApi') {
    const err = new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }

  authorizeApiEndpoint(context, { endpointConfig });

  const routineContext = {
    steps: {},
    payload: serializer.deserialize(payload),
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };

  // async: true — acknowledge now, run the routine in the background.
  // Auth was already checked above; the outcome lands in logs (scheduleBackground)
  // and in whatever the routine itself records.
  if (endpointConfig.async === true) {
    scheduleBackground(context, { event: 'background_endpoint', endpointId }, () =>
      runRoutine(context, routineContext, { routine: endpointConfig.routine })
    );
    return {
      error: null,
      response: serializer.serialize({ accepted: true }),
      status: 'accepted',
      success: true,
    };
  }

  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });

  return buildEndpointResult(context, { error, response, status });
}

export default callEndpoint;
