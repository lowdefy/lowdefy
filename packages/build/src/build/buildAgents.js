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
import { isReserved, type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { RESERVED_PLATFORM_TOOL_NAMES } from '@lowdefy/ai-utils';
import collectExceptions from '../utils/collectExceptions.js';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

// Provider tool-name rule (Anthropic and OpenAI both).
const TOOL_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

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

function validateAgent(agent, context) {
  const configKey = agent?.['~k'];
  if (!type.isObject(agent)) {
    collectExceptions(
      context,
      new ConfigError('Agent should be an object.', { received: agent, configKey })
    );
    return false;
  }
  if (type.isUndefined(agent.id)) {
    collectExceptions(context, new ConfigError('Agent id missing.', { configKey }));
    return false;
  }
  if (!type.isString(agent.id)) {
    collectExceptions(
      context,
      new ConfigError('Agent id is not a string.', { received: agent.id, configKey })
    );
    return false;
  }
  // agent.id becomes agent.agentId, which keys the detectCycles graph and the
  // runtime agent registry - both plain objects. Reject a reserved name here,
  // where the config location is still in hand.
  if (isReserved(agent.id)) {
    collectExceptions(
      context,
      new ConfigError(`Agent id "${agent.id}" is a reserved name and cannot be used as an id.`, {
        configKey,
      })
    );
    return false;
  }
  return true;
}

function validateConnectionRef(agent, components, context) {
  const configKey = agent['~k'];
  if (type.isNone(agent.connectionId)) {
    collectExceptions(
      context,
      new ConfigError(`Agent connectionId is not defined at "${agent.id}".`, { configKey })
    );
    return false;
  }
  // Connections may have been renamed by buildConnections:
  //   connection.connectionId = original id, connection.id = 'connection:' + original id
  const connectionExists = (components.connections ?? []).some(
    (c) => c.id === agent.connectionId || c.connectionId === agent.connectionId
  );
  if (!connectionExists) {
    collectExceptions(
      context,
      new ConfigError(
        `Agent "${agent.id}" references connectionId "${agent.connectionId}" which does not exist.`,
        { configKey, checkSlug: 'connection-refs' }
      )
    );
    return false;
  }
  return true;
}

// Assign LLM-safe tool names. Providers require ^[a-zA-Z0-9_-]{1,64}$ —
// module-scoped endpoint ids contain '/', so the default name replaces
// '/' with '__'; config may override with an explicit "name".
function validateToolNames(agent, context, toolNames) {
  const configKey = agent['~k'];
  for (const toolConfig of agent.tools) {
    if (type.isNone(toolConfig.name)) {
      toolConfig.name = toolConfig.endpointId.replaceAll('/', '__');
    }
    if (!TOOL_NAME_REGEX.test(toolConfig.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" tool name "${toolConfig.name}" is invalid. Tool names must match ^[a-zA-Z0-9_-]{1,64}$ — set "name" on the tool to override the default derived from the endpoint id.`,
          { configKey }
        )
      );
      return false;
    }
    // TOOL_NAME_REGEX admits every reserved name - letters and underscores are
    // in its allowed set - and tool names key the plain-object tools map.
    if (isReserved(toolConfig.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" tool name "${toolConfig.name}" is a reserved name and cannot be used as a tool name.`,
          { configKey }
        )
      );
      return false;
    }
    if (RESERVED_PLATFORM_TOOL_NAMES.includes(toolConfig.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" tool "${
            toolConfig.name
          }" uses a reserved platform tool name. Reserved: ${RESERVED_PLATFORM_TOOL_NAMES.join(
            ', '
          )}.`,
          { configKey }
        )
      );
      return false;
    }
    if (toolNames.has(toolConfig.name)) {
      collectExceptions(
        context,
        new ConfigError(`Agent "${agent.id}" has duplicate tool name "${toolConfig.name}".`, {
          configKey,
        })
      );
      return false;
    }
    toolNames.add(toolConfig.name);
  }
  return true;
}

// Tools must reference existing API endpoints that carry the metadata the
// model needs.
function validateToolEndpoints(agent, components, context) {
  const configKey = agent['~k'];
  for (const toolConfig of agent.tools) {
    const endpoint = (components.api ?? []).find(
      (e) => e.id === toolConfig.endpointId || e.endpointId === toolConfig.endpointId
    );
    if (!endpoint) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" references tool endpoint "${toolConfig.endpointId}" which does not exist.`,
          { configKey }
        )
      );
      return false;
    }
    if (type.isNone(endpoint.description)) {
      collectExceptions(
        context,
        new ConfigError(
          `Endpoint "${toolConfig.endpointId}" is used as an agent tool but does not have a "description".`,
          { configKey: endpoint['~k'] }
        )
      );
      return false;
    }
    if (type.isNone(endpoint.payloadSchema)) {
      collectExceptions(
        context,
        new ConfigError(
          `Endpoint "${toolConfig.endpointId}" is used as an agent tool but does not have a "payloadSchema".`,
          { configKey: endpoint['~k'] }
        )
      );
      return false;
    }
  }
  return true;
}

function validateMcpSources(agent, components, context) {
  const configKey = agent['~k'];
  let index = -1;
  for (const mcpSource of agent.mcp) {
    index += 1;
    if (!type.isNone(mcpSource.connectionId)) {
      const mcpConnectionExists = (components.connections ?? []).some(
        (c) => c.id === mcpSource.connectionId || c.connectionId === mcpSource.connectionId
      );
      if (!mcpConnectionExists) {
        collectExceptions(
          context,
          new ConfigError(
            `Agent "${agent.id}" "mcp" source at index ${index} references connection "${mcpSource.connectionId}" which does not exist.`,
            { configKey, checkSlug: 'connection-refs' }
          )
        );
        return false;
      }
      continue;
    }
    if (mcpSource.transport === 'stdio') {
      if (type.isNone(mcpSource.command)) {
        collectExceptions(
          context,
          new ConfigError(
            `Agent "${agent.id}" "mcp" source at index ${index} uses stdio transport but is missing "command".`,
            { configKey }
          )
        );
        return false;
      }
      continue;
    }
    if (type.isNone(mcpSource.url)) {
      collectExceptions(
        context,
        new ConfigError(`Agent "${agent.id}" "mcp" source at index ${index} is missing "url".`, {
          configKey,
        })
      );
      return false;
    }
  }
  return true;
}

const hookNames = [
  'onStart',
  'onStepStart',
  'onToolCallStart',
  'onToolCallFinish',
  'onStepFinish',
  'onFinish',
];

function validateHooks(agent, components, context) {
  const configKey = agent['~k'];
  for (const hookName of hookNames) {
    for (const endpointId of agent.hooks?.[hookName] ?? []) {
      const endpoint = (components.api ?? []).find(
        (e) => e.id === endpointId || e.endpointId === endpointId
      );
      if (!endpoint) {
        collectExceptions(
          context,
          new ConfigError(
            `Agent "${agent.id}" hook "${hookName}" references endpoint "${endpointId}" which does not exist.`,
            { configKey }
          )
        );
        return false;
      }
    }
  }
  return true;
}

// Sub-agents surface to the model as tools too — same naming rule.
function validateSubAgentNames(agent, context, toolNames) {
  const configKey = agent['~k'];
  for (const ref of agent.agents) {
    if (type.isNone(ref.name)) {
      ref.name = ref.agentId.replaceAll('/', '__');
    }
    if (!TOOL_NAME_REGEX.test(ref.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" sub-agent tool name "${ref.name}" is invalid. Tool names must match ^[a-zA-Z0-9_-]{1,64}$ — set "name" on the sub-agent reference to override the default derived from the agent id.`,
          { configKey }
        )
      );
      return false;
    }
    // Runs on the derived name, so "a/__proto__" -> "a____proto__" is accepted
    // while an explicit reserved "name" is not.
    if (isReserved(ref.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" sub-agent tool name "${ref.name}" is a reserved name and cannot be used as a tool name.`,
          { configKey }
        )
      );
      return false;
    }
    if (RESERVED_PLATFORM_TOOL_NAMES.includes(ref.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" sub-agent "${
            ref.agentId
          }" uses a reserved platform tool name. Reserved: ${RESERVED_PLATFORM_TOOL_NAMES.join(
            ', '
          )}.`,
          { configKey }
        )
      );
      return false;
    }
    if (toolNames.has(ref.name)) {
      collectExceptions(
        context,
        new ConfigError(
          `Agent "${agent.id}" sub-agent "${ref.agentId}" conflicts with an endpoint tool of the same name.`,
          { configKey }
        )
      );
      return false;
    }
    toolNames.add(ref.name);
  }
  return true;
}

function validateFileSystem(agent, context) {
  const configKey = agent['~k'];
  if (!agent.properties?.fileSystem) return true;
  const basePath = agent.properties.fileSystem.basePath;
  if (!type.isString(basePath)) {
    collectExceptions(
      context,
      new ConfigError(`Agent "${agent.id}" fileSystem.basePath is not a string.`, {
        received: basePath,
        configKey,
      })
    );
    return false;
  }
  const resolved = path.resolve(context.directories.config, basePath);
  if (!fs.existsSync(resolved)) {
    collectExceptions(
      context,
      new ConfigError(`Agent "${agent.id}" fileSystem.basePath "${basePath}" does not exist.`, {
        configKey,
      })
    );
    return false;
  }
  return true;
}

function buildAgents({ components, context }) {
  if (!type.isNone(components.agents) && !type.isArray(components.agents)) {
    throw new ConfigError('Agents is not an array.', {
      received: components.agents,
      configKey: components['~k'],
    });
  }
  const agents = type.isArray(components.agents) ? components.agents : [];

  context.agentIds = new Set();

  const checkDuplicateAgentId = createCheckDuplicateId({
    message: 'Duplicate agentId "{{ id }}".',
  });

  agents.forEach((agent) => {
    if (!validateAgent(agent, context)) return;

    const configKey = agent['~k'];

    validateId({ id: agent.id, field: 'Agent id', configKey });
    checkDuplicateAgentId({ id: agent.id, configKey });

    // Track type usage for buildTypes validation
    context.typeCounters.agents.increment(agent.type, configKey);

    if (!validateConnectionRef(agent, components, context)) return;

    // Validate model is defined
    if (type.isNone(agent.properties?.model)) {
      collectExceptions(
        context,
        new ConfigError(`Agent "model" is not defined at "${agent.id}".`, { configKey })
      );
      return;
    }

    // Normalize tool strings to objects
    agent.tools = (agent.tools ?? []).map((tool) => {
      if (type.isString(tool)) {
        return { endpointId: tool };
      }
      return tool;
    });

    const toolNames = new Set();
    if (!validateToolNames(agent, context, toolNames)) return;
    if (!validateToolEndpoints(agent, components, context)) return;

    // Normalize MCP string shorthand to connectionId objects (same pattern as tools)
    agent.mcp = (agent.mcp ?? []).map((mcp) => {
      if (type.isString(mcp)) {
        return { connectionId: mcp };
      }
      return mcp;
    });

    if (!validateMcpSources(agent, components, context)) return;
    if (!validateHooks(agent, components, context)) return;

    // Normalize sub-agent strings to objects (same pattern as tools/mcp)
    agent.agents = (agent.agents ?? []).map((ref) => {
      if (type.isString(ref)) {
        return { agentId: ref };
      }
      return ref;
    });

    if (!validateSubAgentNames(agent, context, toolNames)) return;
    if (!validateFileSystem(agent, context)) return;

    // Rename id to internal format
    agent.agentId = agent.id;
    context.agentIds.add(agent.agentId);
    agent.id = `agent:${agent.agentId}`;

    // Count server operators in properties
    countOperators(agent.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  // Second pass: validate sub-agent references (needs all agentIds collected).
  // Agents that failed the first pass were never normalized, so their
  // sub-agent list is skipped here.
  agents.forEach((agent) => {
    const configKey = agent?.['~k'];

    (agent?.agents ?? []).forEach((subAgentRef) => {
      // Validate sub-agent reference exists
      if (!context.agentIds.has(subAgentRef.agentId)) {
        collectExceptions(
          context,
          new ConfigError(
            `Agent "${agent.agentId}" references sub-agent "${subAgentRef.agentId}" which does not exist.`,
            { configKey }
          )
        );
        return;
      }

      // Warn if sub-agent has tools with confirm: true (unsupported in sub-agent context)
      const subAgent = agents.find((a) => a?.agentId === subAgentRef.agentId);
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
  const cycleNode = detectCycles(agents.filter((agent) => !type.isNone(agent?.agentId)));
  if (cycleNode !== null) {
    const agent = agents.find((a) => a?.agentId === cycleNode);
    collectExceptions(
      context,
      new ConfigError(`Circular sub-agent reference detected involving "${cycleNode}".`, {
        configKey: agent?.['~k'],
      })
    );
  }

  return components;
}

export default buildAgents;
