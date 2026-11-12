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
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { cleanBuildArtifact, serializer, type } from '@lowdefy/helpers';
import { isExpectedError } from '@lowdefy/errors';

import formatErrorForAgent from '../../response/formatErrorForAgent.js';
import mintViewSession from '../auth/view/mintViewSession.js';
import callEndpoint from '../endpoints/callEndpoint.js';
import getLowdefyTheme from '../rootConfig/getLowdefyTheme.js';
import getMcpViews from './getMcpViews.js';
import getViewResourceMeta from './getViewResourceMeta.js';
import getViewToolMeta from './getViewToolMeta.js';
import {
  VIEW_ADDRESS_META_KEY,
  VIEW_RESOURCE_MIME_TYPE,
  VIEW_RESOURCE_URI,
  VIEW_SESSION_META_KEY,
  VIEW_SESSION_TOOL,
} from './mcpViewNames.js';
import renderViewLoader from './renderViewLoader.js';
import resolveViewAddress from './resolveViewAddress.js';
import runAfterToolCall from './runAfterToolCall.js';

// The MCP error code for a resource that does not exist.
const RESOURCE_NOT_FOUND = -32002;

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
//
// When the app has a view (getMcpViews), a tool with one points at the view
// resource and its result carries the address of the page to show, the server
// serves that resource - one fixed loader for every view - and lists the
// built-in tool a view calls for its session. All of it is for a caller who
// can see at least one tool with a view; anyone else gets the answers an app
// with no view gives.
async function createMcpServer({ context }) {
  const mcpConfig = await context.readConfigFile('mcp.json');
  if (type.isNone(mcpConfig) || mcpConfig.configured !== true) {
    return null;
  }

  const views = getMcpViews({
    config: context.config,
    logger: context.logger,
    mcpConfig,
    mode: context.mode,
    secrets: context.secrets,
  });

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

  // Asked by tools/list, by a session tool call and by both resource handlers
  // of one request at most, so the answer is not kept.
  async function canSeeViewTool() {
    for (const { id, scope, view } of mcpConfig.endpoints) {
      if (type.isNone(view)) {
        continue;
      }
      const endpointConfig = await readVisibleEndpointConfig({ id, scope });
      if (!type.isNone(endpointConfig)) {
        return true;
      }
    }
    return false;
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
  const serverOptions = { capabilities: { tools: {} } };
  if (views !== null) {
    serverOptions.capabilities.resources = {};
  }
  if (!type.isNone(mcpConfig.instructions)) {
    serverOptions.instructions = mcpConfig.instructions;
  }
  const server = new Server(serverInfo, serverOptions);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [];
    let hasViewTool = false;
    for (const { id, scope, annotations, view } of mcpConfig.endpoints) {
      const endpointConfig = await readVisibleEndpointConfig({ id, scope });
      if (type.isNone(endpointConfig)) {
        continue;
      }
      const tool = {
        name: toToolName(id),
        description: endpointConfig.description,
        inputSchema: cleanBuildArtifact(endpointConfig.payloadSchema),
      };
      if (!type.isNone(annotations)) {
        tool.annotations = cleanBuildArtifact(annotations);
      }
      if (views !== null && !type.isNone(view)) {
        tool._meta = getViewToolMeta({ view });
        hasViewTool = true;
      }
      tools.push(tool);
    }
    // Listed for the view, which calls it through the host: visibility 'app'
    // asks the host to keep it from the model. That is the host's courtesy, not
    // a control - what the session may do is limited where it is minted and
    // used.
    if (hasViewTool) {
      tools.push({
        name: VIEW_SESSION_TOOL,
        description: 'Signs an open view in. Called by the view, not by the model.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { visibility: ['app'] } },
      });
    }
    return { tools };
  });

  // The session tool never reaches an endpoint, so afterToolCall does not run:
  // the hook observes the app's tools, and a view signing in is not one. The
  // mint writes its own log line. The token goes in _meta, which a host does
  // not show the model, and content stays empty so it is in no transcript.
  async function callViewSessionTool() {
    try {
      const { expiresAt, token } = await mintViewSession(context);
      return {
        content: [],
        _meta: { [VIEW_SESSION_META_KEY]: { token, expiresAt: expiresAt.toISOString() } },
      };
    } catch (error) {
      if (isExpectedError(error)) {
        context.logger.warn(`Refused MCP tool call: ${VIEW_SESSION_TOOL} - ${error.message}`);
      } else {
        await context.handleError(error);
      }
      return {
        content: [{ type: 'text', text: formatErrorForAgent(context, error) }],
        isError: true,
      };
    }
  }

  // The view's address goes beside the result, and the response is also sent
  // as structuredContent, which must be an object. A call whose address cannot
  // be built still answers: the caller gets the plain text result, and the
  // host shows it as it would for a tool with no view.
  async function addViewAddress({ endpoint, payload, reply, response }) {
    let path;
    try {
      path = await resolveViewAddress(context, { payload, response, view: endpoint.view });
    } catch (error) {
      // A path value that is missing, "." or ".." is the call's own outcome and
      // its message names only the placeholder. A failed operator is a fault in
      // the app's config: it goes to the error sink, and its message, which can
      // hold evaluated values, stays out of this line.
      const badPathValue = error.name === 'ConfigError';
      context.logger.warn(
        { event: 'warn_mcp_view_address', endpointId: endpoint.id, pageId: endpoint.view.pageId },
        `MCP tool "${endpoint.id}" answered without its view: ${
          badPathValue ? error.message : 'an operator in its view config failed.'
        }`
      );
      if (!badPathValue) {
        await context.handleError(error);
      }
      return reply;
    }
    return {
      ...reply,
      structuredContent: type.isObject(response) ? response : { response },
      _meta: { [VIEW_ADDRESS_META_KEY]: { path } },
    };
  }

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

    if (views !== null && name === VIEW_SESSION_TOOL) {
      if (!(await canSeeViewTool())) {
        return unknownTool;
      }
      return callViewSessionTool();
    }

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
      const payload = args ?? {};
      const { error, response, success } = await callEndpoint(context, {
        blockId: '_mcp',
        endpointId: endpoint.id,
        outsideCaller: true,
        pageId: '_mcp',
        payload,
      });
      const deserializedResponse = success ? serializer.deserialize(response) : null;
      let reply;
      if (success) {
        reply = { content: [{ type: 'text', text: JSON.stringify(deserializedResponse) }] };
        if (views !== null && !type.isNone(endpoint.view)) {
          reply = await addViewAddress({
            endpoint,
            payload,
            reply,
            response: deserializedResponse,
          });
        }
      } else {
        const deserialized = serializer.deserialize(error);
        // The wire error is generic for every reader. The dev server also attaches the full
        // error for dev tools, and the dev MCP client is a coding agent that needs it to find
        // the failing config.
        const devError = serializer.deserialize(error?.devError);
        reply = {
          content: [
            {
              type: 'text',
              text: type.isNone(deserialized)
                ? 'Endpoint failed.'
                : formatErrorForAgent(context, devError ?? deserialized),
            },
          ],
          isError: true,
        };
      }
      // Only a call that reached its endpoint's routine runs the hook: the
      // early returns above and the refusals caught below never do.
      if (!type.isNone(mcpConfig.afterToolCall)) {
        await runAfterToolCall(context, {
          hookId: mcpConfig.afterToolCall,
          payload: {
            tool: name,
            endpoint_id: endpoint.id,
            scope: endpoint.scope,
            payload,
            success,
            response: deserializedResponse,
          },
        });
      }
      return reply;
    } catch (error) {
      // Refused calls to gated tools and payloads that miss the payloadSchema
      // (UserError) are expected traffic - a warn line and the message the
      // model needs to retry, not a structured error log. Everything else
      // goes through the server's error sink, which resolves the config
      // source, logs it and collects it for the dev feedback channel.
      if (isExpectedError(error)) {
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

  if (views !== null) {
    // An unknown resource and a caller who can see no tool with a view get the
    // same answer, as a hidden tool answers like an unknown one.
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      if (!(await canSeeViewTool())) {
        return { resources: [] };
      }
      return {
        resources: [{ uri: VIEW_RESOURCE_URI, name: 'view', mimeType: VIEW_RESOURCE_MIME_TYPE }],
      };
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      if (uri !== VIEW_RESOURCE_URI || !(await canSeeViewTool())) {
        throw new McpError(RESOURCE_NOT_FOUND, 'Resource not found.', { uri });
      }
      const themeConfig = await getLowdefyTheme({ readConfigFile: context.readConfigFile });
      return {
        contents: [
          {
            uri: VIEW_RESOURCE_URI,
            mimeType: VIEW_RESOURCE_MIME_TYPE,
            text: renderViewLoader({
              appOrigin: views.appOrigin,
              basePath: views.basePath,
              slug: context.appMeta.slug,
              themeConfig,
            }),
            _meta: getViewResourceMeta({ views }),
          },
        ],
      };
    });
  }

  return server;
}

export default createMcpServer;
export { scopeCovers };
