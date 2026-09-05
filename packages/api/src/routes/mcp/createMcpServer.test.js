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

import { jest } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import createMcpServer, { scopeCovers } from './createMcpServer.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mcpJson = {
  name: 'test-tools',
  version: '1.0.0',
  configured: true,
  hasPublicTool: true,
  endpoints: [
    { id: 'health', scope: 'mcp:read' },
    { id: 'get-customer', scope: 'mcp:read' },
    { id: 'update-customer', scope: 'mcp:write' },
  ],
};

const healthConfig = {
  endpointId: 'health',
  id: 'endpoint:health',
  type: 'Api',
  auth: { public: true },
  description: 'Health check.',
  payloadSchema: { type: 'object' },
  routine: { ':return': { ok: true } },
};

const getCustomerConfig = {
  endpointId: 'get-customer',
  id: 'endpoint:get-customer',
  type: 'Api',
  auth: { public: false, roles: ['support'] },
  description: 'Look up a customer.',
  payloadSchema: { type: 'object', properties: { customerId: { type: 'string' } } },
  routine: { ':return': { name: 'Ada' } },
};

const updateCustomerConfig = {
  endpointId: 'update-customer',
  id: 'endpoint:update-customer',
  type: 'Api',
  auth: { public: false, roles: ['support'] },
  description: 'Update a customer.',
  payloadSchema: { type: 'object', properties: { customerId: { type: 'string' } } },
  routine: { ':return': { updated: true } },
};

const anonymousMcpAuth = { orgId: 'org_1', tokenStatus: 'none', parseableJwt: true };

function memberMcpAuth(grantedScopes) {
  return { orgId: 'org_1', tokenStatus: 'valid', parseableJwt: true, grantedScopes };
}

function createContext({ authEnforcement = null, configs = {}, mcpAuth, user = null } = {}) {
  const operators = {
    _fail: () => {
      throw new Error('Boom.');
    },
  };
  const files = {
    'mcp.json': mcpJson,
    'api/health.json': healthConfig,
    'api/get-customer.json': getCustomerConfig,
    'api/update-customer.json': updateCustomerConfig,
    ...configs,
  };
  const readConfigFile = jest.fn((path) => files[path] ?? null);
  const context = testContext({ authEnforcement, logger, operators, readConfigFile, user });
  context.mcpAuth = mcpAuth ?? anonymousMcpAuth;
  context.authorizeOutcome = jest.fn(context.authorizeOutcome);
  return context;
}

async function connectClient(server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

async function listToolNames(context) {
  const server = await createMcpServer({ context });
  const client = await connectClient(server);
  const { tools } = await client.listTools();
  return tools.map((tool) => tool.name);
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('createMcpServer advertises configured branding in serverInfo, stripping build markers', async () => {
  // As read from the build artifact: ~arr already unwrapped, ~k keys still present.
  const iconsArtifact = [
    {
      src: 'https://example.com/icon-512.png',
      mimeType: 'image/png',
      sizes: ['512x512'],
      '~k': 'm1',
    },
  ];
  const icons = [
    { src: 'https://example.com/icon-512.png', mimeType: 'image/png', sizes: ['512x512'] },
  ];
  const context = createContext({
    configs: {
      'mcp.json': {
        ...mcpJson,
        title: 'Test Tools',
        websiteUrl: 'https://example.com',
        icons: iconsArtifact,
      },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);
  expect(client.getServerVersion()).toEqual({
    name: 'test-tools',
    version: '1.0.0',
    title: 'Test Tools',
    websiteUrl: 'https://example.com',
    icons,
  });
});

test('createMcpServer omits branding keys that are not configured', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);
  expect(client.getServerVersion()).toEqual({ name: 'test-tools', version: '1.0.0' });
});

test('createMcpServer returns null when mcp is not configured', async () => {
  const context = createContext({
    configs: { 'mcp.json': { configured: false, endpoints: [] } },
  });
  const server = await createMcpServer({ context });
  expect(server).toBe(null);
});

test('tools/list for an anonymous caller returns only public tools', async () => {
  const context = createContext({ user: null, mcpAuth: anonymousMcpAuth });
  const names = await listToolNames(context);
  expect(names).toEqual(['health']);
  expect(context.authorizeOutcome).toHaveBeenCalled();
  expect(context.authorize).toBeUndefined();
});

test('tools/list for a member with an mcp:read grant returns read tools and no write tools', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:read']),
  });
  const names = await listToolNames(context);
  expect(names).toEqual(['health', 'get-customer']);
});

test('tools/list for a member with an mcp:write grant returns read and write tools', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const names = await listToolNames(context);
  expect(names).toEqual(['health', 'get-customer', 'update-customer']);
});

test('tools/list for a member whose grant is empty returns no tools', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth([]),
  });
  const names = await listToolNames(context);
  expect(names).toEqual([]);
});

test('tools/list for a member with the wrong role hides the role-gated tools', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['viewer'] },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const names = await listToolNames(context);
  expect(names).toEqual(['health']);
});

test('tools/list hides gated tools when the outcome is enrol_required', async () => {
  const context = createContext({
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: '2fa-enrol' },
    user: { id: 'user_1', roles: ['support'], two_factor_enrolled: false },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const names = await listToolNames(context);
  expect(names).toEqual(['health']);
});

test('tools/list cleans build-artifact markers from a payloadSchema with arrays', async () => {
  // Build artifacts wrap location-marked arrays as { '~arr': [...], '~k': '...' }
  // and stamp array items with '~k'/'~r' - as the real build output does for
  // JSON Schema keywords like `required` and `enum`. tools/list must hand the
  // MCP client plain JSON arrays, not these wrapper objects.
  const builtPayloadSchema = {
    type: 'object',
    properties: {
      query: { type: 'string' },
      status: {
        type: 'string',
        enum: {
          '~arr': ['open', 'closed'],
          '~k': 'api.health.payloadSchema.properties.status.enum',
        },
      },
    },
    required: { '~arr': ['query'], '~k': 'api.health.payloadSchema.required' },
  };

  const context = createContext({
    configs: {
      'api/health.json': { ...healthConfig, payloadSchema: builtPayloadSchema },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === 'health');
  expect(tool.inputSchema).toEqual({
    type: 'object',
    properties: {
      query: { type: 'string' },
      status: { type: 'string', enum: ['open', 'closed'] },
    },
    required: ['query'],
  });
  expect(JSON.stringify(tool.inputSchema)).not.toContain('~arr');
  expect(JSON.stringify(tool.inputSchema)).not.toContain('~k');
});

test('tools/call runs an allowed endpoint routine and returns its response', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:read']),
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({
    name: 'get-customer',
    arguments: { customerId: 'c_1' },
  });
  expect(result.isError).toBeFalsy();
  expect(JSON.parse(result.content[0].text)).toEqual({ name: 'Ada' });
  expect(context.authorizeOutcome).toHaveBeenCalled();
});

test('tools/call returns an error result for an unknown tool', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'nope', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "nope".' }]);
});

test('tools/call answers an anonymous caller on a gated tool exactly like an unknown tool', async () => {
  const context = createContext({ user: null, mcpAuth: anonymousMcpAuth });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "get-customer".' }]);
  expect(logger.error).not.toHaveBeenCalled();
});

test('tools/call warns once instead of logging an error when the endpoint gate refuses', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:read']),
  });
  // Visible to the tool listing, refused by the endpoint's own gate - the
  // shape that reaches the handler's catch as an AuthorizationError.
  context.authorizeOutcome = jest.fn().mockReturnValueOnce('allow').mockReturnValue('deny');
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(logger.error).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalledWith(
    'Refused MCP tool call: get-customer - API Endpoint "get-customer" does not exist.'
  );
});

test('tools/call answers a role shortfall exactly like an unknown tool', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['viewer'] },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "get-customer".' }]);
});

test('tools/call answers a scope shortfall exactly like an unknown tool', async () => {
  const context = createContext({
    user: { id: 'user_1', roles: ['support'] },
    mcpAuth: memberMcpAuth(['mcp:read']),
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'update-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "update-customer".' }]);
});

test('tools/call answers an enrol_required outcome exactly like an unknown tool', async () => {
  const context = createContext({
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: '2fa-enrol' },
    user: { id: 'user_1', roles: ['support'], two_factor_enrolled: false },
    mcpAuth: memberMcpAuth(['mcp:write']),
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content).toEqual([{ type: 'text', text: 'Unknown tool "get-customer".' }]);
});

test('scopeCovers applies no filter when the caller carries no token', () => {
  expect(scopeCovers({ grantedScopes: undefined, endpointScope: 'mcp:read' })).toBe(true);
  expect(scopeCovers({ grantedScopes: undefined, endpointScope: 'mcp:write' })).toBe(true);
});

test('scopeCovers grants mcp:read endpoints to read and write grants', () => {
  expect(scopeCovers({ grantedScopes: ['mcp:read'], endpointScope: 'mcp:read' })).toBe(true);
  expect(scopeCovers({ grantedScopes: ['mcp:write'], endpointScope: 'mcp:read' })).toBe(true);
});

test('scopeCovers grants mcp:write endpoints to write grants only', () => {
  expect(scopeCovers({ grantedScopes: ['mcp:write'], endpointScope: 'mcp:write' })).toBe(true);
  expect(scopeCovers({ grantedScopes: ['mcp:read'], endpointScope: 'mcp:write' })).toBe(false);
});

test('scopeCovers covers nothing for an empty grant', () => {
  expect(scopeCovers({ grantedScopes: [], endpointScope: 'mcp:read' })).toBe(false);
  expect(scopeCovers({ grantedScopes: [], endpointScope: 'mcp:write' })).toBe(false);
});

const failingConfig = {
  endpointId: 'failing',
  id: 'endpoint:failing',
  type: 'Api',
  auth: { public: true },
  description: 'Always fails.',
  payloadSchema: { type: 'object' },
  // An operator failure is a fault, so runRoutine passes the error through
  // handleError - unlike :throw, which is a UserError.
  routine: { ':return': { _fail: true } },
};

const failingMcpJson = {
  ...mcpJson,
  endpoints: [...mcpJson.endpoints, { id: 'failing', scope: 'mcp:read' }],
};

test('tools/call returns the bare message of a failed routine in production', async () => {
  const context = createContext({
    configs: { 'mcp.json': failingMcpJson, 'api/failing.json': failingConfig },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'failing', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('Boom.');
  expect(result.content[0].text).not.toContain('(at ');
});

test('tools/call appends the config source of a failed routine when configDirectory is set', async () => {
  const context = createContext({
    configs: { 'mcp.json': failingMcpJson, 'api/failing.json': failingConfig },
  });
  context.configDirectory = '/app';
  // Mirrors createHandleError in server-dev, which resolves the location onto the error.
  context.handleError = jest.fn(async (error) => {
    error.source = '/app/api/failing.yaml:4';
    error.handled = true;
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'failing', arguments: {} });
  expect(result.isError).toBe(true);
  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(result.content[0].text).toContain('Boom.');
  expect(result.content[0].text).toMatch(/ \(at api\/failing\.yaml:4\)$/);
});

test('tools/call routes an unexpected failure through handleError and reports its source in dev', async () => {
  const context = createContext();
  context.configDirectory = '/app';
  context.handleError = jest.fn(async (error) => {
    error.source = 'api/get-customer.yaml:2';
    error.handled = true;
  });
  context.authorizeOutcome = jest.fn(() => {
    throw new Error('Authorization exploded.');
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'health', arguments: {} });
  expect(result.isError).toBe(true);
  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(context.handleError.mock.calls[0][0].message).toEqual('Authorization exploded.');
  expect(result.content[0].text).toEqual('Authorization exploded. (at api/get-customer.yaml:2)');
  expect(logger.warn).not.toHaveBeenCalled();
});
