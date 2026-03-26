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

import { ToolLoopAgent, createAgentUIStreamResponse, tool, jsonSchema, stepCountIs } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { serializer } from '@lowdefy/helpers';

// Build artifacts contain serializer markers (~k, ~r, ~l) as non-enumerable
// properties and ~arr wrappers for arrays. JSON.parse(JSON.stringify(obj))
// strips non-enumerable props and produces a clean JSON Schema for the AI SDK.
function cleanBuildArtifact(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Strip non-serializable fields from AI SDK event objects before sending as payload.
function cleanHookEvent(event) {
  const clean = {};
  for (const [key, value] of Object.entries(event)) {
    if (key === 'messages' || key === 'abortSignal') continue;
    if (typeof value === 'function') continue;
    clean[key] = value;
  }
  return clean;
}

// Maps YAML hook names to AI SDK callback names and creates fire-and-forget callbacks.
const hookMapping = {
  onStart: 'experimental_onStart',
  onStepStart: 'experimental_onStepStart',
  onToolCallStart: 'experimental_onToolCallStart',
  onToolCallFinish: 'experimental_onToolCallFinish',
  onStepFinish: 'onStepFinish',
  onFinish: 'onFinish',
};

function createHookCallbacks({ hooks, callEndpoint }) {
  if (!hooks) return {};

  const callbacks = {};
  for (const [yamlKey, sdkKey] of Object.entries(hookMapping)) {
    const endpointIds = hooks[yamlKey];
    if (!endpointIds || endpointIds.length === 0) continue;

    callbacks[sdkKey] = (event) => {
      const payload = cleanHookEvent(event);
      for (const endpointId of endpointIds) {
        callEndpoint(endpointId, { payload }).catch(() => {});
      }
    };
  }
  return callbacks;
}

async function handleAgentChat({ connection, properties, context }) {
  const { agent, messages } = properties;

  const tools = {};

  for (const toolConfig of agent.tools ?? []) {
    const { endpointId, confirm } = toolConfig;
    const endpointConfig = await context.getEndpointConfig({ endpointId });

    tools[endpointId] = tool({
      description: endpointConfig.description,
      inputSchema: jsonSchema(cleanBuildArtifact(endpointConfig.payloadSchema)),
      ...(confirm ? { needsApproval: true } : {}),
      execute: async (input) => {
        const result = await context.callEndpoint(endpointId, { payload: input });
        if (!result.success) {
          const err = serializer.deserialize(result.error);
          throw new Error(err?.message ?? 'Endpoint execution failed');
        }
        return cleanBuildArtifact(result.response);
      },
    });
  }

  // Create MCP clients
  const mcpClients = [];

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

  // Merge MCP tools with endpoint tools
  for (const { client, source } of mcpClients) {
    try {
      const mcpTools = await client.tools();
      for (const [name, mcpTool] of Object.entries(mcpTools)) {
        if (tools[name]) {
          console.warn(
            `MCP tool "${name}" from ${
              source.url ?? source.command
            } conflicts with endpoint tool — skipped.`
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

  const model = connection.provider(agent.properties.model);

  const hookCallbacks = createHookCallbacks({
    hooks: agent.hooks,
    callEndpoint: context.callEndpoint,
  });

  // Compose MCP cleanup with existing onFinish hook
  if (mcpClients.length > 0) {
    const originalOnFinish = hookCallbacks.onFinish;
    hookCallbacks.onFinish = async (event) => {
      if (originalOnFinish) await originalOnFinish(event);
      await Promise.all(mcpClients.map(({ client }) => client.close().catch(() => {})));
    };
  }

  const agentInstance = new ToolLoopAgent({
    model,
    instructions: agent.properties.instructions,
    tools,
    stopWhen: stepCountIs(agent.properties.maxSteps ?? 10),
    maxOutputTokens: agent.properties.maxOutputTokens,
    temperature: agent.properties.temperature,
    toolChoice: agent.properties.toolChoice ?? 'auto',
    providerOptions: agent.properties.providerOptions,
    ...hookCallbacks,
  });

  const response = await createAgentUIStreamResponse({
    agent: agentInstance,
    uiMessages: messages,
    sendSources: agent.properties.sendSources,
  });
  return { response };
}

export default handleAgentChat;
