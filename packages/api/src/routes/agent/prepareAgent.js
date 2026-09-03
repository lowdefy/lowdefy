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

import buildEndpointResult from '../../response/buildEndpointResult.js';
import getEndpointConfig from '../endpoints/getEndpointConfig.js';
import invokeEndpoint from '../endpoints/invokeEndpoint.js';
import logEvent from '../../log/logEvent.js';
import authorizeAgent from './authorizeAgent.js';
import getAgentConfig from './getAgentConfig.js';
import getAgentResolver from './getAgentResolver.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getConnection from '../connections/getConnection.js';

// Shared agent invocation construction for the streaming chat route (callAgent)
// and the headless CallAgent routine step (handleAgentCall): loads the agent
// config, evaluates operators, creates the provider connection, and builds the
// resolver context. mode ('chat' | 'generate') selects the resolver's execution
// path; endpointDepth threads the endpoint call depth cap through agent tool
// and hook endpoint calls.
async function prepareAgent(context, { agentId, agentContext, endpointDepth = 0, mode = 'chat' }) {
  const agentConfig = await getAgentConfig(context, { agentId });
  authorizeAgent(context, { agentConfig });

  // Evaluate operators in agent properties (e.g. _user, _secret, _payload)
  agentConfig.properties = context.evaluateOperators({
    input: agentConfig.properties ?? {},
    location: agentConfig.agentId,
    payload: agentContext,
    state: {},
    steps: {},
  });

  // Load connection config from build artifacts using agent's connectionId
  const connectionConfig = await getConnectionConfig(context, {
    connectionId: agentConfig.connectionId,
    configKey: agentConfig['~k'],
  });

  // Get connection plugin from registry
  const connection = getConnection(context, { connectionConfig });

  // Evaluate operators in connection properties
  const connectionProperties = context.evaluateOperators({
    input: connectionConfig.properties || {},
    location: connectionConfig.connectionId,
    payload: {},
    state: {},
    steps: {},
  });

  // Create connection instance (e.g., Anthropic provider)
  const connectionInstance = connection.create({ connection: connectionProperties });

  // Get agent type from plugin registry
  const agentType = getAgentResolver(context, { agentConfig });

  // Build resolver context with callEndpoint that allows InternalApi endpoints
  const resolverContext = {
    agentContext,
    i18n: context.i18n,
    logger: context.logger,
    mode,
    evaluateOperators: (input) =>
      context.evaluateOperators({
        input,
        location: agentConfig.agentId,
        payload: agentContext,
        state: {},
        steps: {},
      }),
    // The agent calling one of its declared tools. invokeEndpoint emits the
    // endpoint's own line; this one names the agent that asked for it.
    callEndpoint: async (endpointId, { payload }) => {
      const startTime = performance.now();
      const { error, response, status } = await invokeEndpoint(context, {
        endpointId,
        payload,
        endpointDepth,
      });
      const success = !['error', 'reject'].includes(status);
      logEvent({
        context,
        event: success ? 'agent_tool_completed' : 'agent_tool_failed',
        fields: {
          agent_id: agentConfig.agentId,
          tool: endpointId,
          endpoint_id: endpointId,
          transport: 'agent',
          config_key: agentConfig['~k'],
          duration_ms: Math.round(performance.now() - startTime),
          success,
          error,
        },
      });
      return buildEndpointResult(context, { error, response, status });
    },
    getEndpointConfig: async ({ endpointId }) => {
      return getEndpointConfig(context, { endpointId });
    },
    getAgentConfig: async ({ agentId: subAgentId }) => {
      const subAgentConfig = await getAgentConfig(context, { agentId: subAgentId });
      authorizeAgent(context, { agentConfig: subAgentConfig });
      return subAgentConfig;
    },
    getConnectionForAgent: async ({ agentConfig: subAgentConfig }) => {
      const subConnectionConfig = await getConnectionConfig(context, {
        connectionId: subAgentConfig.connectionId,
        configKey: subAgentConfig['~k'],
      });
      const subConnection = getConnection(context, { connectionConfig: subConnectionConfig });
      const subConnectionProperties = context.evaluateOperators({
        input: subConnectionConfig.properties || {},
        location: subConnectionConfig.connectionId,
        payload: {},
        state: {},
        steps: {},
      });
      return subConnection.create({ connection: subConnectionProperties });
    },
    resolveMcpSources: async ({ agentConfig: subAgentConfig }) => {
      const resolvedMcp = [];
      for (const mcpSource of subAgentConfig.mcp ?? []) {
        if (!type.isNone(mcpSource.connectionId)) {
          const mcpConnConfig = await getConnectionConfig(context, {
            connectionId: mcpSource.connectionId,
            configKey: subAgentConfig['~k'],
          });
          const mcpConnection = getConnection(context, { connectionConfig: mcpConnConfig });
          const mcpConnProps = context.evaluateOperators({
            input: mcpConnConfig.properties || {},
            location: mcpConnConfig.connectionId,
            payload: {},
            state: {},
            steps: {},
          });
          const mcpConfig = mcpConnection.create({ connection: mcpConnProps });
          const { connectionId: _, ...overrides } = mcpSource;
          resolvedMcp.push({ ...mcpConfig, ...overrides });
        } else {
          resolvedMcp.push(mcpSource);
        }
      }
      return resolvedMcp;
    },
  };

  // Resolve MCP connection references to inline config.
  // Agent-level overrides (like confirm) may still contain operators —
  // handleAgentChat evaluates those via its existing evaluateOperators call.
  agentConfig.mcp = await resolverContext.resolveMcpSources({ agentConfig });

  return { agentConfig, connectionInstance, agentType, resolverContext };
}

export default prepareAgent;
