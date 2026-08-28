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

import createMcpServer from './createMcpServer.js';
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
  endpoints: ['get-customer'],
  configured: true,
};

const endpointConfig = {
  endpointId: 'get-customer',
  id: 'endpoint:get-customer',
  type: 'Api',
  auth: { public: true },
  description: 'Look up a customer.',
  payloadSchema: { type: 'object', properties: { customerId: { type: 'string' } } },
  routine: { ':return': { name: 'Ada' } },
};

function createContext({ session = { user: { id: 'user_1' } }, configs = {} } = {}) {
  const files = {
    'mcp.json': mcpJson,
    'api/get-customer.json': endpointConfig,
    ...configs,
  };
  const readConfigFile = jest.fn((path) => files[path] ?? null);
  return testContext({ logger, readConfigFile, session });
}

async function connectClient(server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('createMcpServer returns null when mcp is not configured', async () => {
  const context = createContext({
    configs: { 'mcp.json': { configured: false, endpoints: [] } },
  });
  const server = await createMcpServer({ context });
  expect(server).toBe(null);
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
    icons: [{ src: 'https://example.com/icon-512.png', mimeType: 'image/png', sizes: ['512x512'] }],
  });
});

test('createMcpServer omits branding keys that are not configured', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);
  expect(client.getServerVersion()).toEqual({ name: 'test-tools', version: '1.0.0' });
});

test('tools/list returns endpoint tools for an authorized caller', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const { tools } = await client.listTools();
  expect(tools).toEqual([
    {
      name: 'get-customer',
      description: 'Look up a customer.',
      inputSchema: { type: 'object', properties: { customerId: { type: 'string' } } },
    },
  ]);
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
          '~k': 'api.get-customer.payloadSchema.properties.status.enum',
        },
      },
    },
    required: { '~arr': ['query'], '~k': 'api.get-customer.payloadSchema.required' },
  };

  const context = createContext({
    configs: {
      'api/get-customer.json': { ...endpointConfig, payloadSchema: builtPayloadSchema },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === 'get-customer');
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

test('tools/list filters tools the caller is not authorized for', async () => {
  const context = createContext({
    session: null,
    configs: {
      'api/get-customer.json': { ...endpointConfig, auth: { public: false } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const { tools } = await client.listTools();
  expect(tools).toEqual([]);
});

test('tools/call runs an endpoint routine and returns its response', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({
    name: 'get-customer',
    arguments: { customerId: 'c_1' },
  });
  expect(result.isError).toBeFalsy();
  expect(JSON.parse(result.content[0].text)).toEqual({ name: 'Ada' });
});

test('tools/call returns an error result for an unknown tool', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'nope', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toBe('Unknown tool "nope".');
});

test('tools/call answers an unknown tool like a gated one for an anonymous caller on an auth-configured app', async () => {
  const context = createContext({
    session: null,
    configs: {
      'auth.json': { configured: true },
      'api/get-customer.json': { ...endpointConfig, auth: { public: false } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const unknown = await client.callTool({ name: 'nope', arguments: {} });
  const gated = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(unknown.isError).toBe(true);
  expect(unknown.content[0].text).toBe('Authentication required for API endpoint "nope".');
  expect(gated.content[0].text).toBe('Authentication required for API endpoint "get-customer".');
});

test('tools/call returns a 401-shaped error result for an unauthenticated caller', async () => {
  const context = createContext({
    session: null,
    configs: {
      'api/get-customer.json': { ...endpointConfig, auth: { public: false } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toBe('Authentication required for API endpoint "get-customer".');
  expect(logger.warn).toHaveBeenCalledWith('Unauthenticated MCP tool call: get-customer');
  expect(logger.error).not.toHaveBeenCalled();
});

test('tools/call returns a masked error result for an authenticated caller with the wrong role', async () => {
  const context = createContext({
    session: { user: { id: 'user_1', roles: ['viewer'] } },
    configs: {
      'api/get-customer.json': { ...endpointConfig, auth: { public: false, roles: ['admin'] } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'get-customer', arguments: {} });
  expect(result.isError).toBe(true);
  // callEndpoint masks protected endpoints as missing for wrong-role callers.
  expect(result.content[0].text).toBe('API Endpoint "get-customer" does not exist.');
});
