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

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import authorizeApiEndpoint from '../endpoints/authorizeApiEndpoint.js';
import getEndpointConfig from '../endpoints/getEndpointConfig.js';
import runRoutine from '../endpoints/runRoutine.js';
import getAgentConfig from './getAgentConfig.js';
import getAgentResolver from './getAgentResolver.js';
import getConnectionConfig from '../request/getConnectionConfig.js';
import getConnection from '../request/getConnection.js';

async function callAgent(context, { agentId, pageId, messages }) {
  const { logger } = context;

  context.pageId = pageId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_agent', agentId, pageId });
  const agentConfig = await getAgentConfig(context, { agentId });

  // Load connection config from build artifacts using agent's connectionId
  const connectionConfig = await getConnectionConfig(context, {
    requestConfig: {
      connectionId: agentConfig.connectionId,
      requestId: agentConfig.agentId,
      '~k': agentConfig['~k'],
    },
  });

  // Get connection plugin from registry
  const connection = getConnection(context, { connectionConfig });

  // Evaluate operators in connection properties
  const connectionProperties = context.evaluateOperators({
    input: connectionConfig.properties || {},
    location: connectionConfig.connectionId,
    payload: {},
    steps: {},
  });

  // Create connection instance (e.g., Anthropic provider)
  const connectionInstance = connection.create({ connection: connectionProperties });

  // Get agent type from plugin registry
  const agentType = getAgentResolver(context, { agentConfig });

  // Build resolver context with callEndpoint that allows InternalApi endpoints
  const resolverContext = {
    evaluateOperators: (input) =>
      context.evaluateOperators({
        input,
        location: agentConfig.agentId,
        payload: {},
        steps: {},
      }),
    callEndpoint: async (endpointId, { payload }) => {
      const endpointConfig = await getEndpointConfig(context, { endpointId });
      authorizeApiEndpoint(context, { endpointConfig });
      const routineContext = {
        steps: {},
        payload: payload ?? {},
        arrayIndices: [],
        items: {},
        endpointDepth: 0,
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
    },
    getEndpointConfig: async ({ endpointId }) => {
      return getEndpointConfig(context, { endpointId });
    },
  };

  // Call the agent resolver
  const { response } = await agentType.resolver({
    connection: connectionInstance,
    properties: { agent: agentConfig, messages },
    context: resolverContext,
  });

  return { response };
}

export default callAgent;
