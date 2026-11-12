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

import { createHash } from 'node:crypto';

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { operatorsServer } from '@lowdefy/operators-js';

import createMcpServer from './createMcpServer.js';
import signSessionToken from '../auth/view/signSessionToken.js';
import testContext from '../../test/testContext.js';

const NOW = new Date('2026-11-12T10:00:00Z').getTime();
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// As the build writes it: operators unevaluated, with their location markers.
const taskView = {
  pageId: 'task',
  pathParams: {
    space: { _response: 'space.key', '~k': 'k1' },
    ref: { _payload: 'key', '~k': 'k2' },
    '~k': 'k3',
  },
  urlQuery: { tab: { _payload: 'tab', '~k': 'k4' }, '~k': 'k5' },
  entrypoint: false,
};

const mcpJson = {
  name: 'test-tools',
  version: '1.0.0',
  configured: true,
  hasPublicTool: true,
  endpoints: [
    { id: 'health', scope: 'mcp:read' },
    { id: 'open-task', scope: 'mcp:read', view: taskView },
    { id: 'open-board', scope: 'mcp:write', view: { pageId: 'board', entrypoint: true } },
    { id: 'count-tasks', scope: 'mcp:read', view: { pageId: 'board', entrypoint: false } },
  ],
  views: {
    configured: true,
    pages: {
      board: { endpoints: [], websockets: [], agents: [] },
      task: { endpoints: [], websockets: [], agents: [] },
    },
    sources: ['https://files.example.com', { _secret: 'ANALYTICS_ORIGIN', '~k': 'k6' }],
  },
};

const hookCalls = [];
const mockRecordRequest = vi.fn(async ({ request }) => {
  hookCalls.push(request.call);
  return null;
});
mockRecordRequest.schema = {};
mockRecordRequest.meta = { checkRead: false, checkWrite: false };

const files = {
  'mcp.json': mcpJson,
  'routes.json': [
    { pageId: 'task', path: '{space}/tasks/{ref}', auth: { public: false } },
    { pageId: 'board', path: 'board', auth: { public: false } },
  ],
  'theme.json': {},
  'api/health.json': {
    endpointId: 'health',
    id: 'endpoint:health',
    type: 'Api',
    auth: { public: true },
    description: 'Health check.',
    payloadSchema: { type: 'object' },
    routine: { ':return': { ok: true } },
  },
  'api/open-task.json': {
    endpointId: 'open-task',
    id: 'endpoint:open-task',
    type: 'Api',
    auth: { public: false, roles: ['support'] },
    description: 'Open a task.',
    payloadSchema: { type: 'object', properties: { key: { type: 'string' } } },
    routine: {
      ':if': { _payload: 'fail' },
      ':then': { ':reject': { message: 'No such task.' } },
      ':else': {
        ':return': { space: { key: { _payload: 'spaceKey' } }, title: 'Fix the gate' },
      },
    },
  },
  'api/open-board.json': {
    endpointId: 'open-board',
    id: 'endpoint:open-board',
    type: 'Api',
    auth: { public: false, roles: ['support'] },
    description: 'Open the board.',
    payloadSchema: { type: 'object' },
    routine: { ':return': { open: 3 } },
  },
  'api/count-tasks.json': {
    endpointId: 'count-tasks',
    id: 'endpoint:count-tasks',
    type: 'Api',
    auth: { public: false, roles: ['support'] },
    description: 'Count the tasks.',
    payloadSchema: { type: 'object' },
    routine: { ':return': 3 },
  },
  'api/record-tool-call.json': {
    endpointId: 'record-tool-call',
    id: 'endpoint:record-tool-call',
    type: 'InternalApi',
    auth: { public: false, roles: ['support'] },
    routine: {
      id: 'request:record-tool-call:record',
      type: 'RecordRequest',
      stepId: 'record',
      connectionId: 'test',
      properties: { call: { _payload: true } },
    },
  },
  'connections/test.json': { id: 'connection:test', type: 'TestConnection', connectionId: 'test' },
};

const supportUser = { id: 'user_1', roles: ['support'] };

function oauthMcpAuth(grantedScopes = ['mcp:read', 'mcp:write']) {
  return {
    clientId: 'client_1',
    organizationId: 'org_1',
    tokenStatus: 'valid',
    parseableJwt: true,
    grantedScopes,
  };
}

const anonymousMcpAuth = { tokenStatus: 'none', parseableJwt: true };

function createContext({
  appMeta = { slug: 'tasks', buildId: 'build_1' },
  config = {},
  configs = {},
  mcpAuth = oauthMcpAuth(),
  mode = 'prod',
  secrets = { ANALYTICS_ORIGIN: 'https://stats.example.com' },
  user = supportUser,
} = {}) {
  const allFiles = { ...files, ...configs };
  const context = testContext({
    appMeta,
    authEnforcement: { roles: user?.roles ?? [] },
    config,
    connections: {
      TestConnection: { schema: {}, requests: { RecordRequest: mockRecordRequest } },
    },
    logger,
    mode,
    operators: operatorsServer,
    readConfigFile: vi.fn((path) => allFiles[path] ?? null),
    secrets,
    user,
  });
  context.mcpAuth = mcpAuth;
  const internalAdapter = {
    createSession: vi.fn(async (userId, dontRememberMe, override) => ({
      id: 'sess_1',
      token: 'tok',
      userId,
      activeOrganizationId: 'org_1',
      ...override,
    })),
    deleteSession: vi.fn(),
  };
  const adapter = { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() };
  context.auth = { $context: Promise.resolve({ adapter, internalAdapter, secret: 'secret' }) };
  return context;
}

async function connect(context) {
  const server = await createMcpServer({ context });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

async function listTools(context) {
  const client = await connect(context);
  const { tools } = await client.listTools();
  return Object.fromEntries(tools.map((tool) => [tool.name, tool]));
}

function claudeDomain(resourceUri) {
  const hash = createHash('sha256').update(resourceUri).digest('hex');
  return `${hash.slice(0, 32)}.claudemcpcontent.com`;
}

beforeEach(() => {
  vi.clearAllMocks();
  hookCalls.length = 0;
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  process.env.BETTER_AUTH_URL = 'https://app.example.com';
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

test('createMcpServer advertises the resources capability when a tool has a view', async () => {
  const client = await connect(createContext());
  expect(client.getServerCapabilities()).toEqual({ tools: {}, resources: {} });
});

test('createMcpServer advertises no resources capability when no tool has a view', async () => {
  const client = await connect(
    createContext({
      configs: {
        'mcp.json': { ...mcpJson, views: { configured: false, pages: {}, sources: [] } },
      },
    })
  );
  expect(client.getServerCapabilities()).toEqual({ tools: {} });
});

test('tools/list gives a tool with a view its resource uri under both keys, and an entry point when configured', async () => {
  const tools = await listTools(createContext());
  expect(tools['open-task']._meta).toEqual({
    ui: { resourceUri: 'ui://lowdefy/view' },
    'ui/resourceUri': 'ui://lowdefy/view',
  });
  expect(tools['open-board']._meta).toEqual({
    ui: { resourceUri: 'ui://lowdefy/view' },
    'ui/resourceUri': 'ui://lowdefy/view',
    'openai/ui': { entrypoints: [{ type: 'global' }] },
  });
});

test('tools/list leaves a tool without a view unchanged', async () => {
  const tools = await listTools(createContext());
  expect(tools.health).toEqual({
    name: 'health',
    description: 'Health check.',
    inputSchema: { type: 'object' },
  });
});

test('tools/list lists lowdefy_view_session as an app-only tool for a caller who can see a tool with a view', async () => {
  const tools = await listTools(createContext());
  expect(tools.lowdefy_view_session).toEqual({
    name: 'lowdefy_view_session',
    description: 'Signs an open view in. Called by the view, not by the model.',
    inputSchema: { type: 'object', properties: {} },
    _meta: { ui: { visibility: ['app'] } },
  });
});

test('tools/list does not list lowdefy_view_session when the app has no view', async () => {
  const tools = await listTools(
    createContext({
      configs: {
        'mcp.json': {
          ...mcpJson,
          endpoints: [{ id: 'health', scope: 'mcp:read' }],
          views: { configured: false, pages: {}, sources: [] },
        },
      },
    })
  );
  expect(Object.keys(tools)).toEqual(['health']);
});

test('tools/list does not list lowdefy_view_session for a caller who can see no tool with a view', async () => {
  const tools = await listTools(createContext({ user: null, mcpAuth: anonymousMcpAuth }));
  expect(Object.keys(tools)).toEqual(['health']);
});

test('tools/list keeps scope filtering for tools with a view', async () => {
  const tools = await listTools(createContext({ mcpAuth: oauthMcpAuth(['mcp:read']) }));
  expect(Object.keys(tools)).toEqual([
    'health',
    'open-task',
    'count-tasks',
    'lowdefy_view_session',
  ]);
});

test('tools/call on a tool with a view returns the response as structuredContent and the page address in _meta', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({
    name: 'open-task',
    arguments: { key: 'OPS-1', spaceKey: 'OPS', tab: 'files & notes' },
  });
  expect(result).toEqual({
    content: [{ type: 'text', text: '{"space":{"key":"OPS"},"title":"Fix the gate"}' }],
    structuredContent: { space: { key: 'OPS' }, title: 'Fix the gate' },
    _meta: { 'lowdefy/view': { path: '/OPS/tasks/OPS-1?tab=files+%26+notes' } },
  });
});

test('tools/call on a tool with a view and no path params returns the page path with no query', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({ name: 'open-board', arguments: {} });
  expect(result._meta).toEqual({ 'lowdefy/view': { path: '/board' } });
  expect(result.structuredContent).toEqual({ open: 3 });
});

test('tools/call wraps a response that is not an object for structuredContent', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({ name: 'count-tasks', arguments: {} });
  expect(result.content).toEqual([{ type: 'text', text: '3' }]);
  expect(result.structuredContent).toEqual({ response: 3 });
});

test('tools/call on a tool without a view replies as before', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({ name: 'health', arguments: {} });
  expect(result).toEqual({ content: [{ type: 'text', text: '{"ok":true}' }] });
});

test('tools/call returns the text result with no view address when a path value is missing, and logs why', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({ name: 'open-task', arguments: { key: 'OPS-1' } });
  expect(result).toEqual({
    content: [{ type: 'text', text: '{"space":{"key":null},"title":"Fix the gate"}' }],
  });
  expect(logger.warn.mock.calls).toEqual([
    [
      { event: 'warn_mcp_view_address', endpointId: 'open-task', pageId: 'task' },
      'MCP tool "open-task" answered without its view: Link to page "task" is missing a value for path placeholder "space".',
    ],
  ]);
  expect(logger.error).not.toHaveBeenCalled();
});

test.each(['.', '..'])(
  'tools/call returns the text result with no view address when a path value is "%s"',
  async (value) => {
    const client = await connect(createContext());
    const result = await client.callTool({
      name: 'open-task',
      arguments: { key: value, spaceKey: 'OPS' },
    });
    expect(Object.keys(result)).toEqual(['content']);
    expect(logger.warn.mock.calls[0][1]).toEqual(
      `MCP tool "open-task" answered without its view: Link to page "task" has the value "${value}" for path placeholder "ref". A path value cannot be "." or "..".`
    );
  }
);

test('tools/call returns the text result with no view address when a view operator fails, and reports the fault', async () => {
  const client = await connect(
    createContext({
      configs: {
        'mcp.json': {
          ...mcpJson,
          endpoints: [
            {
              id: 'open-task',
              scope: 'mcp:read',
              view: { ...taskView, urlQuery: { tab: { _if: { test: 'no', then: 1, else: 2 } } } },
            },
          ],
        },
      },
    })
  );
  const result = await client.callTool({
    name: 'open-task',
    arguments: { key: 'OPS-1', spaceKey: 'OPS' },
  });
  expect(Object.keys(result)).toEqual(['content']);
  expect(logger.warn.mock.calls).toEqual([
    [
      { event: 'warn_mcp_view_address', endpointId: 'open-task', pageId: 'task' },
      'MCP tool "open-task" answered without its view: an operator in its view config failed.',
    ],
  ]);
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('tools/call returns a failed call as text with no view address', async () => {
  const client = await connect(createContext());
  const result = await client.callTool({
    name: 'open-task',
    arguments: { key: 'OPS-1', spaceKey: 'OPS', fail: true },
  });
  expect(result.isError).toBe(true);
  expect(Object.keys(result).sort()).toEqual(['content', 'isError']);
});

test('tools/call on a tool with a view the caller cannot see answers like an unknown tool', async () => {
  const client = await connect(createContext({ user: null, mcpAuth: anonymousMcpAuth }));
  const hidden = await client.callTool({ name: 'open-task', arguments: {} });
  const unknown = await client.callTool({ name: 'no-such-tool', arguments: {} });
  expect(hidden).toEqual({
    content: [{ type: 'text', text: 'Unknown tool "open-task".' }],
    isError: true,
  });
  expect(unknown).toEqual({
    content: [{ type: 'text', text: 'Unknown tool "no-such-tool".' }],
    isError: true,
  });
});

test('lowdefy_view_session returns the bearer in the result _meta with nothing in content', async () => {
  const context = createContext();
  const client = await connect(context);
  const result = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(result).toEqual({
    content: [],
    _meta: {
      'lowdefy/viewSession': {
        token: signSessionToken({ secret: 'secret', token: 'tok' }),
        expiresAt: '2026-11-12T10:15:00.000Z',
      },
    },
  });
});

test('lowdefy_view_session does not run afterToolCall, which still runs for the app tools', async () => {
  const context = createContext({
    configs: { 'mcp.json': { ...mcpJson, afterToolCall: 'record-tool-call' } },
  });
  const client = await connect(context);
  await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(hookCalls).toEqual([]);
  await client.callTool({ name: 'open-board', arguments: {} });
  expect(hookCalls.map((call) => call.tool)).toEqual(['open-board']);
});

test('lowdefy_view_session refuses a member token', async () => {
  const context = createContext({
    mcpAuth: {
      organizationId: 'org_1',
      tokenStatus: 'valid',
      parseableJwt: true,
      grantedScopes: ['mcp:read', 'mcp:write'],
      tokenId: 'token_1',
    },
  });
  const client = await connect(context);
  const result = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(result).toEqual({
    content: [
      {
        type: 'text',
        text: 'A view session needs an OAuth connection. A member token cannot open one.',
      },
    ],
    isError: true,
  });
  expect((await context.auth.$context).internalAdapter.createSession).not.toHaveBeenCalled();
});

test('lowdefy_view_session refuses an anonymous caller who can see a public tool with a view', async () => {
  const context = createContext({
    user: null,
    mcpAuth: anonymousMcpAuth,
    configs: {
      'mcp.json': {
        ...mcpJson,
        endpoints: [{ id: 'health', scope: 'mcp:read', view: { pageId: 'board' } }],
      },
    },
  });
  const client = await connect(context);
  const result = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(result).toEqual({
    content: [{ type: 'text', text: 'A view session needs a signed-in MCP caller.' }],
    isError: true,
  });
  expect((await context.auth.$context).internalAdapter.createSession).not.toHaveBeenCalled();
});

test('lowdefy_view_session answers like an unknown tool for a caller who can see no tool with a view', async () => {
  const context = createContext({ user: null, mcpAuth: anonymousMcpAuth });
  const client = await connect(context);
  const result = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(result).toEqual({
    content: [{ type: 'text', text: 'Unknown tool "lowdefy_view_session".' }],
    isError: true,
  });
});

test('resources/read returns the loader with the mcp-app mime type and the host metadata', async () => {
  const client = await connect(createContext());
  const { contents } = await client.readResource({ uri: 'ui://lowdefy/view' });
  expect(contents).toHaveLength(1);
  const [content] = contents;
  expect(content.uri).toEqual('ui://lowdefy/view');
  expect(content.mimeType).toEqual('text/html;profile=mcp-app');
  expect(content.text.startsWith('<!DOCTYPE html>')).toBe(true);
  expect(content._meta).toEqual({
    ui: {
      domain: claudeDomain('https://app.example.com/api/mcp'),
      csp: {
        resourceDomains: [
          'https://app.example.com',
          'https://files.example.com',
          'https://stats.example.com',
        ],
        connectDomains: [
          'https://app.example.com',
          'wss://app.example.com',
          'https://files.example.com',
          'https://stats.example.com',
        ],
      },
    },
  });
});

test('resources/read returns identical HTML for two builds with different build ids', async () => {
  const first = await connect(createContext({ appMeta: { slug: 'tasks', buildId: 'build_1' } }));
  const second = await connect(createContext({ appMeta: { slug: 'tasks', buildId: 'build_2' } }));
  const firstRead = await first.readResource({ uri: 'ui://lowdefy/view' });
  const secondRead = await second.readResource({ uri: 'ui://lowdefy/view' });
  expect(firstRead.contents[0].text).toEqual(secondRead.contents[0].text);
  expect(firstRead.contents[0].text).not.toContain('build_1');
});

test('resources/read is refused for a caller who can see no tool with a view, as for an unknown resource', async () => {
  const anonymous = await connect(createContext({ user: null, mcpAuth: anonymousMcpAuth }));
  const hidden = await anonymous.readResource({ uri: 'ui://lowdefy/view' }).catch((error) => error);
  const member = await connect(createContext());
  const unknown = await member.readResource({ uri: 'ui://lowdefy/other' }).catch((error) => error);
  expect(hidden.code).toEqual(-32002);
  expect(hidden.message).toEqual(unknown.message);
  expect(hidden.code).toEqual(unknown.code);
});

test('resources/list lists the view only for a caller who can see a tool with a view', async () => {
  const member = await connect(createContext());
  expect(await member.listResources()).toEqual({
    resources: [{ uri: 'ui://lowdefy/view', name: 'view', mimeType: 'text/html;profile=mcp-app' }],
  });
  const anonymous = await connect(createContext({ user: null, mcpAuth: anonymousMcpAuth }));
  expect(await anonymous.listResources()).toEqual({ resources: [] });
});

test('the dev server leaves view metadata off its tools and registers no resources', async () => {
  const context = createContext({ mode: 'dev' });
  const client = await connect(context);
  expect(client.getServerCapabilities()).toEqual({ tools: {} });
  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual([
    'health',
    'open-task',
    'open-board',
    'count-tasks',
  ]);
  expect(tools.every((tool) => tool._meta === undefined)).toBe(true);
  const result = await client.callTool({
    name: 'open-task',
    arguments: { key: 'OPS-1', spaceKey: 'OPS' },
  });
  expect(result).toEqual({
    content: [{ type: 'text', text: '{"space":{"key":"OPS"},"title":"Fix the gate"}' }],
  });
  const session = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(session).toEqual({
    content: [{ type: 'text', text: 'Unknown tool "lowdefy_view_session".' }],
    isError: true,
  });
  await expect(client.readResource({ uri: 'ui://lowdefy/view' })).rejects.toThrow();
});

test('view metadata is left off when the app has no view host', async () => {
  delete process.env.BETTER_AUTH_URL;
  const client = await connect(createContext());
  expect(client.getServerCapabilities()).toEqual({ tools: {} });
  const { tools } = await client.listTools();
  expect(tools.map((tool) => tool.name)).toEqual([
    'health',
    'open-task',
    'open-board',
    'count-tasks',
  ]);
  expect(tools.every((tool) => tool._meta === undefined)).toBe(true);
  const session = await client.callTool({ name: 'lowdefy_view_session', arguments: {} });
  expect(session.isError).toBe(true);
  expect(session.content[0].text).toEqual('Unknown tool "lowdefy_view_session".');
});
