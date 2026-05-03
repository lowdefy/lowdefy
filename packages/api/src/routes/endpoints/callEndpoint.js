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
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import extractInitiator from '../../audit/extractInitiator.js';
import getEndpointConfig from './getEndpointConfig.js';
import runRoutine from './runRoutine.js';

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
    endpointDepth: 0,
  };

  const startTime = Date.now();
  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });

  const success = !['error', 'reject'].includes(status);

  const captureEndpoint = context.audit?.enabled && context.auditConfig?.capture?.endpoint;
  context.audit?.log({
    category: 'endpoint',
    eventType: success ? 'endpoint.execute' : 'endpoint.fail',
    severity: success ? 'medium' : 'high',
    initiator: extractInitiator(context),
    target: {
      type: 'endpoint',
      id: endpointId,
      pageId: context.pageId,
    },
    action: 'execute',
    outcome: success ? 'success' : 'failure',
    metadata: {
      status,
      blockId: context.blockId,
      duration: Date.now() - startTime,
      payload: captureEndpoint?.payload ? routineContext.payload : undefined,
      response: captureEndpoint?.response ? response : undefined,
      errorName: error?.name,
      errorMessage: error?.message,
    },
    rid: context.rid,
  });

  return {
    error: serializer.serialize(error),
    response: serializer.serialize(response),
    status: success ? 'success' : status,
    success,
  };
}

export default callEndpoint;
