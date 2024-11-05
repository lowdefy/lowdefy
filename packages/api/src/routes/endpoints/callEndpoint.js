import { serializer } from '@lowdefy/helpers';

import runRoutine from './runRoutine.js';
import getEndpointConfig from './getEndpointConfig.js';
import getOperatorsParser from './getOperatorsParser.js';

async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  const { logger } = context;
  logger.debug({ event: 'debug_endpoint', blockId, endpointId, pageId, payload });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  context.state = {};
  context.operatorsParser = getOperatorsParser(context, { payload });

  const { error, response, status } = runRoutine(context, {
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
