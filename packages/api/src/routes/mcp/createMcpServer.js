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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { serializer, type } from '@lowdefy/helpers';

import callAgentGenerate from '../agent/callAgentGenerate.js';
import callEndpoint from '../endpoints/callEndpoint.js';

// LLM-safe tool names use the same rule as buildAgents tool naming.
function toToolName(id) {
  return id.replaceAll('/', '__');
}

// A stateless per-request MCP server exposing the configured api endpoints
// and agents as tools. Built with the SDK's low-level Server: tool input
// schemas are config-provided JSON Schema (payloadSchema), which the
// low-level handlers accept directly - no zod conversion. The server is
// constructed with the request's context, so the caller is known at
// construction time: tools/list filters by context.authorize, and tools/call
// re-authorizes inside callEndpoint / prepareAgent (defense in depth).
// Returns null when no mcp block is configured.
async function createMcpServer({ context }) {
  const mcpConfig = await context.readConfigFile('mcp.json');
  if (type.isNone(mcpConfig) || mcpConfig.configured !== true) {
    return null;
  }

  const server = new Server(
    { name: mcpConfig.name, version: mcpConfig.version },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [];
    for (const endpointId of mcpConfig.endpoints) {
      const endpointConfig = await context.readConfigFile(`api/${endpointId}.json`);
      if (type.isNone(endpointConfig) || !context.authorize(endpointConfig)) {
        continue;
      }
      tools.push({
        name: toToolName(endpointId),
        description: endpointConfig.description,
        inputSchema: endpointConfig.payloadSchema,
      });
    }
    for (const agentId of mcpConfig.agents) {
      const agentConfig = await context.readConfigFile(`agents/${agentId}.json`);
      if (type.isNone(agentConfig) || !context.authorize(agentConfig)) {
        continue;
      }
      tools.push({
        name: toToolName(agentId),
        description: agentConfig.description,
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The task or question for the agent.',
            },
          },
          required: ['prompt'],
        },
      });
    }
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    context.logger.info({ event: 'mcp_tool_call', tool: name });

    const endpointId = mcpConfig.endpoints.find((id) => toToolName(id) === name);
    const agentId = mcpConfig.agents.find((id) => toToolName(id) === name);

    try {
      if (!type.isNone(endpointId)) {
        const { error, response, success } = await callEndpoint(context, {
          blockId: '_mcp',
          endpointId,
          pageId: '_mcp',
          payload: args ?? {},
        });
        if (!success) {
          const deserialized = serializer.deserialize(error);
          return {
            content: [{ type: 'text', text: deserialized?.message ?? 'Endpoint failed.' }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(serializer.deserialize(response)) }],
        };
      }
      if (!type.isNone(agentId)) {
        const { result } = await callAgentGenerate(context, {
          agentId,
          prompt: args?.prompt ?? '',
        });
        return {
          content: [{ type: 'text', text: result.text }],
        };
      }
      return {
        content: [{ type: 'text', text: `Unknown tool "${name}".` }],
        isError: true,
      };
    } catch (error) {
      context.logger.error(error);
      return {
        content: [{ type: 'text', text: error.message }],
        isError: true,
      };
    }
  });

  return server;
}

export default createMcpServer;
