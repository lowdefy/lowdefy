import { serializer } from '@lowdefy/helpers';

import runRoutine from './runRoutine.js';
import getEndpointConfig from './getEndpointConfig.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';

async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const { logger } = context;

  const deserializedPayload = serializer.deserialize(payload);
  context.evaluateOperators = createEvaluateOperators(context, { payload: deserializedPayload });

  logger.debug({ event: 'debug_endpoint', blockId, endpointId, pageId, payload });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  const { error, response, status } = await runRoutine(context, {
    blockId,
    endpointId,
    pageId,
    payload: deserializedPayload,
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
