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

import { ToolLoopAgent, tool, jsonSchema, stepCountIs } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { ConfigError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import listFiles from './fileSystem/listFiles.js';
import readFile from './fileSystem/readFile.js';
import searchFiles from './fileSystem/searchFiles.js';
import statFile from './fileSystem/statFile.js';
import RESERVED_PLATFORM_TOOL_NAMES from './reservedToolNames.js';

// Build artifacts carry serializer markers (~k, ~r, ~l) and wrap location-marked
// arrays as { '~arr': [...], '~k': '...' }. serializer.deserialize un-wraps
// ~arr back to a plain array and demotes markers to non-enumerable properties;
// the subsequent JSON round-trip drops those non-enumerable markers, leaving a
// clean structure for the AI SDK.
function cleanBuildArtifact(obj) {
  return JSON.parse(JSON.stringify(serializer.deserialize(obj)));
}

function assertNotReserved(name, kind) {
  if (RESERVED_PLATFORM_TOOL_NAMES.includes(name)) {
    throw new ConfigError(
      `${kind} "${name}" uses a reserved platform tool name. ` +
        `Rename it (e.g., to "${name}-app" or "custom-${name}"). ` +
        `Reserved: ${RESERVED_PLATFORM_TOOL_NAMES.join(', ')}.`
    );
  }
}

async function buildAgentTools({ agent, context, depth = 0 }) {
  const MAX_DEPTH = 5;
  if (depth > MAX_DEPTH) {
    throw new Error(`Sub-agent nesting exceeds maximum depth of ${MAX_DEPTH}.`);
  }

  const tools = {};
  const mcpClients = [];

  // Build endpoint tools
  for (const toolConfig of agent.tools ?? []) {
    const { endpointId, confirm } = toolConfig;
    assertNotReserved(endpointId, 'Endpoint tool');
    const endpointConfig = await context.getEndpointConfig({ endpointId });

    tools[endpointId] = tool({
      description: endpointConfig.description,
      inputSchema: jsonSchema(cleanBuildArtifact(endpointConfig.payloadSchema)),
      ...(confirm ? { needsApproval: true } : {}),
      execute: async (input, { toolCallId, abortSignal } = {}) => {
        const result = await context.callEndpoint(endpointId, { payload: input, abortSignal });
        if (!result.success) {
          const err = serializer.deserialize(result.error);
          throw new Error(err?.message ?? 'Endpoint execution failed');
        }
        const output = cleanBuildArtifact(result.response);

        if (toolConfig.display && context.writeDataPart) {
          context.writeDataPart({
            type: 'data-display',
            id: `display-${endpointId}-${toolCallId ?? Date.now()}`,
            data: {
              toolCallId,
              toolName: endpointId,
              display: toolConfig.display,
              output,
              input,
            },
          });
        }

        return output;
      },
    });
  }

  // Build MCP clients and merge their tools
  for (const mcpSource of agent.mcp ?? []) {
    const evaluatedSource = context.evaluateOperators(mcpSource);

    try {
      let transport;
      if (evaluatedSource.transport === 'stdio') {
        transport = new Experimental_StdioMCPTransport({
          command: evaluatedSource.command,
          args: evaluatedSource.args,
          env: { ...process.env, ...(evaluatedSource.env ?? {}) },
        });
      } else {
        transport = {
          type: evaluatedSource.transport ?? 'http',
          url: evaluatedSource.url,
          ...(evaluatedSource.headers ? { headers: evaluatedSource.headers } : {}),
        };
      }
      const client = await createMCPClient({ transport });
      mcpClients.push({ client, source: evaluatedSource });
    } catch (err) {
      const label =
        evaluatedSource.transport === 'stdio' ? evaluatedSource.command : evaluatedSource.url;
      console.warn(`MCP server "${label}" unreachable: ${err.message}`);
    }
  }

  // Merge MCP tools with endpoint tools.
  // MCP tool names come from external servers at runtime — on collisions with
  // reserved platform names or existing endpoint tools we warn + skip rather
  // than fail, since the names aren't under app control.
  for (const { client, source } of mcpClients) {
    try {
      const mcpTools = await client.tools();
      for (const [name, mcpTool] of Object.entries(mcpTools)) {
        if (RESERVED_PLATFORM_TOOL_NAMES.includes(name)) {
          console.warn(
            `MCP tool "${name}" from ${source.url ?? source.command} ` +
              `uses a reserved platform tool name — skipped.`
          );
          continue;
        }
        if (tools[name]) {
          console.warn(
            `MCP tool "${name}" from ${source.url ?? source.command} ` +
              `conflicts with endpoint tool — skipped.`
          );
          continue;
        }
        if (source.confirm) {
          tools[name] = { ...mcpTool, needsApproval: true };
        } else {
          tools[name] = mcpTool;
        }
      }
    } catch (err) {
      const label = source.transport === 'stdio' ? source.command : source.url;
      console.warn(`MCP server "${label}" tool listing failed: ${err.message}`);
    }
  }

  // Build sub-agent tools
  for (const subAgentRef of agent.agents ?? []) {
    assertNotReserved(subAgentRef.agentId, 'Sub-agent');
    const subAgentConfig = await context.getAgentConfig({ agentId: subAgentRef.agentId });
    const subConnection = await context.getConnectionForAgent({ agentConfig: subAgentConfig });
    subAgentConfig.mcp = await context.resolveMcpSources({ agentConfig: subAgentConfig });

    // Recursively build sub-agent's tools
    const { tools: subTools, mcpClients: subMcpClients } = await buildAgentTools({
      agent: subAgentConfig,
      context,
      depth: depth + 1,
    });

    const subModel = subConnection.provider(subAgentConfig.properties.model);

    const subAgent = new ToolLoopAgent({
      model: subModel,
      instructions: subAgentConfig.properties.instructions,
      tools: subTools,
      stopWhen: stepCountIs(subAgentConfig.properties.maxSteps ?? 10),
      maxOutputTokens: subAgentConfig.properties.maxOutputTokens,
      temperature: subAgentConfig.properties.temperature,
      toolChoice: subAgentConfig.properties.toolChoice ?? 'auto',
      providerOptions: subAgentConfig.properties.providerOptions,
    });

    const description =
      subAgentRef.description ?? `Delegate task to the ${subAgentRef.agentId} agent`;

    const inputSchema = subAgentRef.inputSchema
      ? jsonSchema(subAgentRef.inputSchema)
      : jsonSchema({
          type: 'object',
          properties: { task: { type: 'string', description: 'The task to delegate' } },
          required: ['task'],
        });

    tools[subAgentRef.agentId] = tool({
      description,
      inputSchema,
      execute: async (input, { abortSignal }) => {
        const prompt = input.task ?? JSON.stringify(input);
        const result = await subAgent.generate({ prompt, abortSignal });

        // Cleanup sub-agent's MCP clients
        await Promise.all(subMcpClients.map(({ client }) => client.close().catch(() => {})));

        return { _subAgent: true, agentId: subAgentRef.agentId, text: result.text };
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: output.text ?? String(output),
      }),
    });
  }

  // Build fileSystem tools
  if (agent.properties?.fileSystem) {
    const { basePath } = agent.properties.fileSystem;

    tools['read-file'] = tool({
      description:
        'Read a file by path. Use list-files or search-files first to discover available paths.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to the base directory.' },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => readFile(basePath, { path }),
    });

    tools['list-files'] = tool({
      description: 'List files and directories. Supports optional glob patterns for filtering.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to list. Omit for root.',
          },
          glob: {
            type: 'string',
            description: 'Glob pattern to filter results, e.g. "**/*.md".',
          },
        },
      }),
      execute: async (params) => listFiles(basePath, params),
    });

    tools['search-files'] = tool({
      description:
        'Search for text across files. Returns matching files with line numbers and context.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to search for.' },
          glob: {
            type: 'string',
            description: 'Glob pattern to limit which files are searched.',
          },
        },
        required: ['query'],
      }),
      execute: async (params) => searchFiles(basePath, params),
    });

    tools['stat-file'] = tool({
      description: 'Get metadata for a file or directory (size, type, modified date).',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File or directory path relative to the base directory.',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => statFile(basePath, { path }),
    });
  }

  return { tools, mcpClients };
}

export default buildAgentTools;
