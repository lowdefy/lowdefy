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

import path from 'path';
import fs from 'fs';
import { type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

// Allowed display block types for agent tool displays.
// Keep in sync with packages/utils/ai-utils/src/allowedDisplayBlocks.js.
const ALLOWED_DISPLAY_BLOCKS = [
  'Alert',
  'Badge',
  'Card',
  'Descriptions',
  'Divider',
  'List',
  'Progress',
  'Result',
  'Statistic',
  'S3Table',
  'Tag',
  'Timeline',
];

function detectCycles(agents) {
  const graph = {};
  for (const agent of agents) {
    graph[agent.agentId] = (agent.agents ?? []).map((ref) => ref.agentId);
  }

  const visited = new Set();
  const inStack = new Set();

  function dfs(id) {
    if (inStack.has(id)) return id;
    if (visited.has(id)) return null;

    visited.add(id);
    inStack.add(id);

    for (const neighbor of graph[id] ?? []) {
      const cycleNode = dfs(neighbor);
      if (cycleNode !== null) return cycleNode;
    }

    inStack.delete(id);
    return null;
  }

  for (const id of Object.keys(graph)) {
    const cycleNode = dfs(id);
    if (cycleNode !== null) {
      return cycleNode;
    }
  }
  return null;
}

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

      // Validate display config if present
      if (toolConfig.display) {
        if (type.isNone(toolConfig.display.type)) {
          throw new ConfigError(
            `Tool "${toolConfig.endpointId}" on agent "${agent.id}" has a display config without a "type" property.`,
            { configKey }
          );
        }
        if (!ALLOWED_DISPLAY_BLOCKS.includes(toolConfig.display.type)) {
          throw new ConfigError(
            `Tool "${toolConfig.endpointId}" on agent "${agent.id}" has display type "${toolConfig.display.type}" which is not an allowed display block.`,
            { configKey }
          );
        }
        // Count display block type for bundling
        context.typeCounters.blocks.increment(toolConfig.display.type, configKey);
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
    agent.mcp.forEach((mcpSource, index) => {
      if (!type.isNone(mcpSource.connectionId)) {
        // Validate connectionId references an existing connection
        const mcpConnectionExists = (components.connections ?? []).some(
          (c) => c.id === mcpSource.connectionId || c.connectionId === mcpSource.connectionId
        );
        if (!mcpConnectionExists) {
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

    // Normalize sub-agent strings to objects (same pattern as tools/mcp)
    agent.agents = (agent.agents ?? []).map((ref) => {
      if (type.isString(ref)) {
        return { agentId: ref };
      }
      return ref;
    });

    // Validate fileSystem basePath if present
    if (agent.properties?.fileSystem) {
      const basePath = agent.properties.fileSystem.basePath;
      if (!type.isString(basePath)) {
        throw new ConfigError(
          `Agent "${agent.id}" fileSystem.basePath is not a string.`,
          { received: basePath, configKey }
        );
      }
      const resolved = path.resolve(context.directories.config, basePath);
      if (!fs.existsSync(resolved)) {
        throw new ConfigError(
          `Agent "${agent.id}" fileSystem.basePath "${basePath}" does not exist.`,
          { configKey }
        );
      }
    }

    // Rename id to internal format
    agent.agentId = agent.id;
    context.agentIds.add(agent.agentId);
    agent.id = `agent:${agent.agentId}`;

    // Count server operators in properties
    countOperators(agent.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  // Second pass: validate sub-agent references (needs all agentIds collected)
  (components.agents ?? []).forEach((agent) => {
    const configKey = agent['~k'];

    agent.agents.forEach((subAgentRef) => {
      // Validate sub-agent reference exists
      if (!context.agentIds.has(subAgentRef.agentId)) {
        throw new ConfigError(
          `Agent "${agent.agentId}" references sub-agent "${subAgentRef.agentId}" which does not exist.`,
          { configKey }
        );
      }

      // Check for name collision with endpoint tools
      const hasToolCollision = agent.tools.some(
        (toolConfig) => toolConfig.endpointId === subAgentRef.agentId
      );
      if (hasToolCollision) {
        throw new ConfigError(
          `Agent "${agent.agentId}" sub-agent "${subAgentRef.agentId}" conflicts with an endpoint tool of the same name.`,
          { configKey }
        );
      }

      // Warn if sub-agent has tools with confirm: true (unsupported in sub-agent context)
      const subAgent = components.agents.find((a) => a.agentId === subAgentRef.agentId);
      const hasConfirmTools = (subAgent?.tools ?? []).some((t) => t.confirm);
      if (hasConfirmTools) {
        context.handleWarning(
          new ConfigWarning(
            `Agent "${subAgentRef.agentId}" has tools with confirm: true, but tool approval is not supported in sub-agent context. Tools will auto-execute when called as a sub-agent.`,
            { configKey }
          )
        );
      }
    });
  });

  // Detect circular sub-agent references
  const cycleNode = detectCycles(components.agents);
  if (cycleNode !== null) {
    const agent = components.agents.find((a) => a.agentId === cycleNode);
    throw new ConfigError(`Circular sub-agent reference detected involving "${cycleNode}".`, {
      configKey: agent?.['~k'],
    });
  }

  return components;
}

export default buildAgents;
