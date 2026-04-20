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

import createPhaseLogger from './createPhaseLogger.js';
import listFiles from './fileSystem/listFiles.js';
import readFile from './fileSystem/readFile.js';
import searchFiles from './fileSystem/searchFiles.js';
import statFile from './fileSystem/statFile.js';
import RESERVED_PLATFORM_TOOL_NAMES from './reservedToolNames.js';

// Build artifacts contain serializer markers (~k, ~r, ~l) as non-enumerable
// properties and ~arr wrappers for arrays. JSON.parse(JSON.stringify(obj))
// strips non-enumerable props and produces a clean JSON Schema for the AI SDK.
function cleanBuildArtifact(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (key.startsWith('~')) return undefined;
      return value;
    })
  );
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

  const parentLogger = context?.phaseLogger ?? createPhaseLogger();
  const phaseLogger = parentLogger.child({ buildDepth: depth });

  phaseLogger.phase('tools.build.start', {
    endpointToolCount: agent.tools?.length ?? 0,
    mcpSourceCount: agent.mcp?.length ?? 0,
    subAgentCount: agent.agents?.length ?? 0,
    hasFileSystem: Boolean(agent.properties?.fileSystem),
  });

  const tools = {};
  const mcpClients = [];

  // Build endpoint tools
  for (const toolConfig of agent.tools ?? []) {
    const { endpointId, confirm } = toolConfig;
    assertNotReserved(endpointId, 'Endpoint tool');
    // eslint-disable-next-line no-await-in-loop
    const endpointConfig = await phaseLogger.time(
      'tools.endpoint.config.load',
      () => context.getEndpointConfig({ endpointId }),
      { endpointId }
    );

    tools[endpointId] = tool({
      description: endpointConfig.description,
      inputSchema: jsonSchema(cleanBuildArtifact(endpointConfig.payloadSchema)),
      ...(confirm ? { needsApproval: true } : {}),
      execute: async (input, { abortSignal } = {}) => {
        const result = await context.callEndpoint(endpointId, { payload: input, abortSignal });
        if (!result.success) {
          const err = serializer.deserialize(result.error);
          throw new Error(err?.message ?? 'Endpoint execution failed');
        }
        return cleanBuildArtifact(result.response);
      },
    });
  }

  // Build MCP clients and merge their tools
  for (let i = 0; i < (agent.mcp?.length ?? 0); i += 1) {
    const mcpSource = agent.mcp[i];
    const evaluatedSource = context.evaluateOperators(mcpSource);
    const label =
      evaluatedSource.transport === 'stdio' ? evaluatedSource.command : evaluatedSource.url;
    const mcpLog = phaseLogger.child({
      mcpIndex: i,
      transport: evaluatedSource.transport ?? 'http',
      label,
    });

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
      // eslint-disable-next-line no-await-in-loop
      const client = await mcpLog.time('tools.mcp.client.create', () =>
        createMCPClient({ transport })
      );
      mcpClients.push({ client, source: evaluatedSource });
    } catch (err) {
      mcpLog.phase('tools.mcp.client.unreachable', {
        err: { message: err?.message, name: err?.name },
      });
      // eslint-disable-next-line no-console
      console.warn(`MCP server "${label}" unreachable: ${err.message}`);
    }
  }

  // Merge MCP tools with endpoint tools.
  // MCP tool names come from external servers at runtime — on collisions with
  // reserved platform names or existing endpoint tools we warn + skip rather
  // than fail, since the names aren't under app control.
  for (const { client, source } of mcpClients) {
    const label = source.transport === 'stdio' ? source.command : source.url;
    const mcpLog = phaseLogger.child({ label });
    try {
      // eslint-disable-next-line no-await-in-loop
      const mcpTools = await mcpLog.time('tools.mcp.list', () => client.tools());
      let added = 0;
      let skipped = 0;
      for (const [name, mcpTool] of Object.entries(mcpTools)) {
        if (RESERVED_PLATFORM_TOOL_NAMES.includes(name)) {
          skipped += 1;
          // eslint-disable-next-line no-console
          console.warn(
            `MCP tool "${name}" from ${source.url ?? source.command} ` +
              `uses a reserved platform tool name — skipped.`
          );
          continue;
        }
        if (tools[name]) {
          skipped += 1;
          // eslint-disable-next-line no-console
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
        added += 1;
      }
      mcpLog.phase('tools.mcp.merged', { added, skipped });
    } catch (err) {
      mcpLog.phase('tools.mcp.list.failed', {
        err: { message: err?.message, name: err?.name },
      });
      // eslint-disable-next-line no-console
      console.warn(`MCP server "${label}" tool listing failed: ${err.message}`);
    }
  }

  // Build sub-agent tools
  for (const subAgentRef of agent.agents ?? []) {
    assertNotReserved(subAgentRef.agentId, 'Sub-agent');
    const subLog = phaseLogger.child({ subAgentId: subAgentRef.agentId });
    // eslint-disable-next-line no-await-in-loop
    const subAgentConfig = await subLog.time('tools.subagent.config.load', () =>
      context.getAgentConfig({ agentId: subAgentRef.agentId })
    );
    // eslint-disable-next-line no-await-in-loop
    const subConnection = await subLog.time('tools.subagent.connection', () =>
      context.getConnectionForAgent({ agentConfig: subAgentConfig })
    );
    // eslint-disable-next-line no-await-in-loop
    subAgentConfig.mcp = await subLog.time('tools.subagent.mcp.resolve', () =>
      context.resolveMcpSources({ agentConfig: subAgentConfig })
    );

    // Recursively build sub-agent's tools
    // eslint-disable-next-line no-await-in-loop
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
    phaseLogger.phase('tools.filesystem.registered');
  }

  phaseLogger.phase('tools.build.done', {
    toolCount: Object.keys(tools).length,
    mcpClientCount: mcpClients.length,
  });

  return { tools, mcpClients };
}

export default buildAgentTools;
