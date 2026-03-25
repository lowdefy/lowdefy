/* eslint-disable no-param-reassign */

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
import { ConfigError } from '@lowdefy/errors';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function buildAgents({ components, context }) {
  if (type.isNone(components.agents)) {
    return components;
  }

  context.agentIds = new Set();

  const checkDuplicateAgentId = createCheckDuplicateId({
    message: 'Duplicate agentId "{{ id }}".',
  });

  (components.agents ?? []).forEach((agent) => {
    const configKey = agent['~k'];

    // Check duplicates
    checkDuplicateAgentId({ id: agent.id, configKey });

    // Track type usage for buildTypes validation
    context.typeCounters.agents.increment(agent.type, configKey);

    // Validate connectionId is provided
    if (type.isNone(agent.connectionId)) {
      throw new ConfigError(`Agent connectionId is not defined at "${agent.id}".`, {
        configKey,
      });
    }

    // Validate connectionId references an existing connection
    // Connections may have been renamed by buildConnections:
    //   connection.connectionId = original id, connection.id = 'connection:' + original id
    const connectionExists = (components.connections ?? []).some(
      (c) => c.id === agent.connectionId || c.connectionId === agent.connectionId
    );
    if (!connectionExists) {
      throw new ConfigError(
        `Agent "${agent.id}" references connectionId "${agent.connectionId}" which does not exist.`,
        { configKey }
      );
    }

    // Validate model is defined
    if (type.isNone(agent.properties?.model)) {
      throw new ConfigError(`Agent "model" is not defined at "${agent.id}".`, {
        configKey,
      });
    }

    // Normalize tool strings to objects
    agent.tools = (agent.tools ?? []).map((tool) => {
      if (type.isString(tool)) {
        return { endpointId: tool };
      }
      return tool;
    });

    // Validate tools reference existing API endpoints with required tool metadata
    agent.tools.forEach((toolConfig) => {
      const endpoint = (components.api ?? []).find(
        (e) => e.id === toolConfig.endpointId || e.endpointId === toolConfig.endpointId
      );
      if (!endpoint) {
        throw new ConfigError(
          `Agent "${agent.id}" references tool endpoint "${toolConfig.endpointId}" which does not exist.`,
          { configKey }
        );
      }
      if (type.isNone(endpoint.description)) {
        throw new ConfigError(
          `Endpoint "${toolConfig.endpointId}" is used as an agent tool but does not have a "description".`,
          { configKey: endpoint['~k'] }
        );
      }
      if (type.isNone(endpoint.payloadSchema)) {
        throw new ConfigError(
          `Endpoint "${toolConfig.endpointId}" is used as an agent tool but does not have a "payloadSchema".`,
          { configKey: endpoint['~k'] }
        );
      }
    });

    // Normalize MCP string shorthand to connectionId objects (same pattern as tools)
    agent.mcp = (agent.mcp ?? []).map((mcp) => {
      if (type.isString(mcp)) {
        return { connectionId: mcp };
      }
      return mcp;
    });

    // Validate MCP sources
    (agent.mcp ?? []).forEach((mcpSource, index) => {
      if (!type.isNone(mcpSource.connectionId)) {
        // Validate connectionId references an existing connection
        const connectionExists = (components.connections ?? []).some(
          (c) => c.id === mcpSource.connectionId || c.connectionId === mcpSource.connectionId
        );
        if (!connectionExists) {
          throw new ConfigError(
            `Agent "${agent.id}" "mcp" source at index ${index} references connection "${mcpSource.connectionId}" which does not exist.`,
            { configKey }
          );
        }
      } else if (mcpSource.transport === 'stdio') {
        if (type.isNone(mcpSource.command)) {
          throw new ConfigError(
            `Agent "${agent.id}" "mcp" source at index ${index} uses stdio transport but is missing "command".`,
            { configKey }
          );
        }
      } else {
        if (type.isNone(mcpSource.url)) {
          throw new ConfigError(
            `Agent "${agent.id}" "mcp" source at index ${index} is missing "url".`,
            { configKey }
          );
        }
      }
    });

    // Validate hooks reference existing API endpoints
    const hookNames = [
      'onStart',
      'onStepStart',
      'onToolCallStart',
      'onToolCallFinish',
      'onStepFinish',
      'onFinish',
    ];
    hookNames.forEach((hookName) => {
      (agent.hooks?.[hookName] ?? []).forEach((endpointId) => {
        const endpoint = (components.api ?? []).find(
          (e) => e.id === endpointId || e.endpointId === endpointId
        );
        if (!endpoint) {
          throw new ConfigError(
            `Agent "${agent.id}" hook "${hookName}" references endpoint "${endpointId}" which does not exist.`,
            { configKey }
          );
        }
      });
    });

    // Rename id to internal format
    agent.agentId = agent.id;
    context.agentIds.add(agent.agentId);
    agent.id = `agent:${agent.agentId}`;

    // Count server operators in properties
    countOperators(agent.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildAgents;
