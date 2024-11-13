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

import { serializer } from '@lowdefy/helpers';

import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';

async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const { logger } = context;

  context.blockId = blockId;
  context.endpointId = endpointId;
  context.pageId = pageId;
  context.payload = serializer.deserialize(payload);
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_endpoint', blockId, endpointId, pageId, payload });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  authorizeApiEndpoint(context, { endpointConfig });

  const routineContext = {
    arrayIndices: [],
    items: {},
  };

  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });

  const success = !['error', 'reject'].includes(status);

  return {
    error: serializer.serialize(error),
    response: serializer.serialize(response),
    status: success ? 'success' : status,
    success,
  };
}

export default callEndpoint;
