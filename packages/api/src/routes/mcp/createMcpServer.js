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

import formatErrorForAgent from '../../response/formatErrorForAgent.js';
import callEndpoint from '../endpoints/callEndpoint.js';

// LLM-safe tool names use the same rule as buildAgents tool naming.
function toToolName(id) {
  return id.replaceAll('/', '__');
}

// Whether the caller's token grant covers an endpoint's scope tag, over the
// closed vocabulary (mcp:read, mcp:write) with mcp:write implying mcp:read.
// An undefined grant is a caller with no token: consent never happened, so
// there is nothing to filter on - the authorization outcome alone limits them
// to public tools. An empty grant is the opposite: consent happened and
// granted this client nothing on this surface, so it covers no scope.
function scopeCovers({ grantedScopes, endpointScope }) {
  if (type.isUndefined(grantedScopes)) {
    return true;
  }
  if (endpointScope === 'mcp:write') {
    return grantedScopes.includes('mcp:write');
  }
  return grantedScopes.includes('mcp:read') || grantedScopes.includes('mcp:write');
}

// Twin of cleanBuildArtifact in packages/utils/ai-utils/src/buildAgentTools.js -
// duplicated here rather than shared, since pulling in @lowdefy/ai-utils would
// add the ai SDK and MCP client deps to api just for this. Strips build-artifact
// serializer markers (~k, ~r, ~l) and unwraps { '~arr': [...] } back to a plain
// array, so payloadSchema reaches MCP clients as plain JSON Schema.
function cleanBuildArtifact(obj) {
  return JSON.parse(JSON.stringify(serializer.deserialize(obj)));
}

// A stateless per-request MCP server exposing the configured api endpoints
// as tools. Built with the SDK's low-level Server: tool input schemas are
// config-provided JSON Schema (payloadSchema), which the low-level handlers
// accept directly - no zod conversion. The server is constructed with the
// request's context, so the caller is known at construction time: a tool is
// visible only when the authorization outcome is 'allow' AND the caller's
// token grant covers the endpoint's scope tag. tools/call re-applies both
// checks before dispatch - callEndpoint re-authorizes roles inside, but the
// scope filter exists only on this surface. Returns null when no mcp block
// is configured.
async function createMcpServer({ context }) {
  const mcpConfig = await context.readConfigFile('mcp.json');
  if (type.isNone(mcpConfig) || mcpConfig.configured !== true) {
    return null;
  }

  async function readVisibleEndpointConfig({ id, scope }) {
    const endpointConfig = await context.readConfigFile(`api/${id}.json`);
    if (type.isNone(endpointConfig)) {
      return null;
    }
    // 'deny' and 'enrol_required' both hide the tool - an unenrolled member
    // must not see an enrolment redirect leak which tools exist for them.
    if (context.authorizeOutcome(endpointConfig) !== 'allow') {
      return null;
    }
    if (!scopeCovers({ grantedScopes: context.mcpAuth?.grantedScopes, endpointScope: scope })) {
      return null;
    }
    return endpointConfig;
  }

  // serverInfo doubles as the connector card in clients such as claude.ai:
  // title, websiteUrl and icons are optional branding the app may configure,
  // and are omitted (not sent as undefined) when it does not. icons is config
  // structure, so like payloadSchema it carries build-artifact markers that
  // must not reach the client.
  const serverInfo = { name: mcpConfig.name, version: mcpConfig.version };
  for (const key of ['title', 'websiteUrl']) {
    if (!type.isNone(mcpConfig[key])) {
      serverInfo[key] = mcpConfig[key];
    }
  }
  if (!type.isNone(mcpConfig.icons)) {
    serverInfo.icons = cleanBuildArtifact(mcpConfig.icons);
  }
  const server = new Server(serverInfo, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [];
    for (const { id, scope } of mcpConfig.endpoints) {
      const endpointConfig = await readVisibleEndpointConfig({ id, scope });
      if (type.isNone(endpointConfig)) {
        continue;
      }
      tools.push({
        name: toToolName(id),
        description: endpointConfig.description,
        inputSchema: cleanBuildArtifact(endpointConfig.payloadSchema),
      });
    }
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    context.logger.info({ event: 'mcp_tool_call', tool: name });

    // A role or scope shortfall answers exactly like a name that does not
    // exist: any distinguishable error would let a caller enumerate which
    // gated tools this app has. Same reason it is isError content over 200,
    // not an HTTP status.
    const unknownTool = {
      content: [{ type: 'text', text: `Unknown tool "${name}".` }],
      isError: true,
    };

    const endpoint = (mcpConfig.endpoints ?? []).find(({ id }) => toToolName(id) === name);
    if (type.isNone(endpoint)) {
      return unknownTool;
    }

    try {
      const endpointConfig = await readVisibleEndpointConfig({
        id: endpoint.id,
        scope: endpoint.scope,
      });
      if (type.isNone(endpointConfig)) {
        return unknownTool;
      }
      const { error, response, success } = await callEndpoint(context, {
        blockId: '_mcp',
        endpointId: endpoint.id,
        pageId: '_mcp',
        payload: args ?? {},
      });
      if (!success) {
        const deserialized = serializer.deserialize(error);
        return {
          content: [
            {
              type: 'text',
              text: type.isNone(deserialized)
                ? 'Endpoint failed.'
                : formatErrorForAgent(context, deserialized),
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(serializer.deserialize(response)) }],
      };
    } catch (error) {
      // Refused calls to gated tools and payloads that miss the payloadSchema
      // (UserError) are expected traffic - a warn line and the message the
      // model needs to retry, not a structured error log. Everything else
      // goes through the server's error sink, which resolves the config
      // source, logs it and collects it for the dev feedback channel.
      if (
        ['AuthenticationError', 'AuthorizationError', 'TwoFactorEnrolmentRequiredError'].includes(
          error.name
        )
      ) {
        context.logger.warn(`Refused MCP tool call: ${name} - ${error.message}`);
      } else if (error.name === 'UserError') {
        context.logger.warn(`Refused MCP tool call: ${name} - ${error.message}`);
      } else {
        await context.handleError(error);
      }
      return {
        content: [{ type: 'text', text: formatErrorForAgent(context, error) }],
        isError: true,
      };
    }
  });

  return server;
}

export default createMcpServer;
export { scopeCovers };
