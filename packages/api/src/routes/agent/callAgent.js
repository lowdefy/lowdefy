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

import { serializer, type } from '@lowdefy/helpers';
import { createPhaseLogger } from '@lowdefy/ai-utils';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import authorizeApiEndpoint from '../endpoints/authorizeApiEndpoint.js';
import getEndpointConfig from '../endpoints/getEndpointConfig.js';
import runRoutine from '../endpoints/runRoutine.js';
import getAgentConfig from './getAgentConfig.js';
import getAgentResolver from './getAgentResolver.js';
import getConnectionConfig from '../request/getConnectionConfig.js';
import getConnection from '../request/getConnection.js';

async function callAgent(
  context,
  {
    agentId,
    pageId,
    messages,
    conversationId,
    urlQuery,
    sharedState,
    phaseLogger: ingressPhaseLogger,
    turnId,
  }
) {
  const { logger } = context;

  context.pageId = pageId;
  context.evaluateOperators = createEvaluateOperators(context);

  // Use the ingress-provided phase logger when present so turnId/turnStart are
  // continuous with the HTTP-ingress logs. Fall back to a fresh logger so
  // internal callers of callAgent still get structured output.
  const phaseLogger =
    ingressPhaseLogger ??
    createPhaseLogger({
      logger,
      agentId,
      pageId,
      conversationId: conversationId ?? undefined,
      turnId,
    });
  context.phaseLogger = phaseLogger;

  logger.debug({ event: 'debug_agent', agentId, pageId });
  phaseLogger.phase('handler.entry');

  const agentConfig = await phaseLogger.time('config.agent.load', () =>
    getAgentConfig(context, { agentId })
  );

  const agentContext = {
    conversationId: conversationId ?? undefined,
    pageId,
    sharedState: sharedState ?? {},
    urlQuery: urlQuery ?? {},
    userId: context.user?.sub ?? context.user?.id ?? null,
  };

  // Evaluate operators in agent properties (e.g. _user, _secret, _payload)
  agentConfig.properties = await phaseLogger.time('operators.agent.properties', () =>
    context.evaluateOperators({
      input: agentConfig.properties ?? {},
      location: agentConfig.agentId,
      payload: agentContext,
      steps: {},
    })
  );

  // Load connection config from build artifacts using agent's connectionId
  const connectionConfig = await phaseLogger.time('config.connection.load', () =>
    getConnectionConfig(context, {
      requestConfig: {
        connectionId: agentConfig.connectionId,
        requestId: agentConfig.agentId,
        '~k': agentConfig['~k'],
      },
    })
  );

  // Get connection plugin from registry
  const connection = getConnection(context, { connectionConfig });

  // Evaluate operators in connection properties
  const connectionProperties = await phaseLogger.time('operators.connection.properties', () =>
    context.evaluateOperators({
      input: connectionConfig.properties || {},
      location: connectionConfig.connectionId,
      payload: {},
      steps: {},
    })
  );

  // Create connection instance (e.g., Anthropic provider)
  const connectionInstance = await phaseLogger.time('connection.instantiate', () =>
    Promise.resolve(connection.create({ connection: connectionProperties }))
  );

  // Get agent type from plugin registry
  const agentType = getAgentResolver(context, { agentConfig });
  phaseLogger.phase('resolver.lookup.done', { type: agentConfig.type });

  // Build resolver context with callEndpoint that allows InternalApi endpoints
  const resolverContext = {
    agentContext,
    phaseLogger,
    evaluateOperators: (input) =>
      context.evaluateOperators({
        input,
        location: agentConfig.agentId,
        payload: agentContext,
        steps: {},
      }),
    callEndpoint: async (endpointId, { payload, abortSignal, kind = 'tool' } = {}) => {
      const prefix = kind === 'hook' ? 'hook.endpoint' : 'tool.endpoint';
      const callLog = phaseLogger.child({ endpointId, kind });
      return callLog.time(
        `${prefix}.exec`,
        async () => {
          const endpointConfig = await callLog.time(`${prefix}.config.load`, () =>
            getEndpointConfig(context, { endpointId })
          );
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
        { hasPayload: payload != null }
      );
    },
    getEndpointConfig: async ({ endpointId }) => {
      return getEndpointConfig(context, { endpointId });
    },
    getAgentConfig: async ({ agentId }) => {
      return getAgentConfig(context, { agentId });
    },
    getConnectionForAgent: async ({ agentConfig: subAgentConfig }) => {
      const subConnectionConfig = await getConnectionConfig(context, {
        requestConfig: {
          connectionId: subAgentConfig.connectionId,
          requestId: subAgentConfig.agentId,
          '~k': subAgentConfig['~k'],
        },
      });
      const subConnection = getConnection(context, { connectionConfig: subConnectionConfig });
      const subConnectionProperties = context.evaluateOperators({
        input: subConnectionConfig.properties || {},
        location: subConnectionConfig.connectionId,
        payload: {},
        steps: {},
      });
      return subConnection.create({ connection: subConnectionProperties });
    },
    resolveMcpSources: async ({ agentConfig: subAgentConfig }) => {
      const resolvedMcp = [];
      for (const mcpSource of subAgentConfig.mcp ?? []) {
        if (!type.isNone(mcpSource.connectionId)) {
          const mcpConnConfig = await getConnectionConfig(context, {
            requestConfig: {
              connectionId: mcpSource.connectionId,
              requestId: subAgentConfig.agentId,
              '~k': subAgentConfig['~k'],
            },
          });
          const mcpConnection = getConnection(context, { connectionConfig: mcpConnConfig });
          const mcpConnProps = context.evaluateOperators({
            input: mcpConnConfig.properties || {},
            location: mcpConnConfig.connectionId,
            payload: {},
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
  const resolvedMcp = [];
  const mcpSources = agentConfig.mcp ?? [];
  phaseLogger.phase('mcp.sources.resolve.start', { sourceCount: mcpSources.length });
  for (let i = 0; i < mcpSources.length; i += 1) {
    const mcpSource = mcpSources[i];
    if (!type.isNone(mcpSource.connectionId)) {
      const mcpLog = phaseLogger.child({ mcpIndex: i, connectionId: mcpSource.connectionId });
      // eslint-disable-next-line no-await-in-loop
      const mcpConfig = await mcpLog.time('mcp.source.resolve', async () => {
        const mcpConnConfig = await getConnectionConfig(context, {
          requestConfig: {
            connectionId: mcpSource.connectionId,
            requestId: agentConfig.agentId,
            '~k': agentConfig['~k'],
          },
        });
        const mcpConnection = getConnection(context, { connectionConfig: mcpConnConfig });
        const mcpConnProps = context.evaluateOperators({
          input: mcpConnConfig.properties || {},
          location: mcpConnConfig.connectionId,
          payload: {},
          steps: {},
        });
        return mcpConnection.create({ connection: mcpConnProps });
      });
      const { connectionId: _, ...overrides } = mcpSource;
      resolvedMcp.push({ ...mcpConfig, ...overrides });
    } else {
      resolvedMcp.push(mcpSource);
    }
  }
  agentConfig.mcp = resolvedMcp;
  phaseLogger.phase('mcp.sources.resolve.done', { resolvedCount: resolvedMcp.length });

  phaseLogger.phase('resolver.dispatch.start', { type: agentConfig.type });
  // Call the agent resolver
  const { response } = await agentType.resolver({
    connection: connectionInstance,
    properties: { agent: agentConfig, messages },
    context: resolverContext,
  });
  phaseLogger.phase('resolver.dispatch.returned');

  return { response };
}

export default callAgent;
