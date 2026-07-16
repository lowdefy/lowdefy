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
  agents: ['support-bot'],
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

const agentConfig = {
  agentId: 'support-bot',
  id: 'agent:support-bot',
  auth: { public: true },
  type: 'ClaudeAgent',
  connectionId: 'my-anthropic',
  description: 'Answers support questions.',
  properties: { model: 'test-model' },
};

const connectionConfig = {
  connectionId: 'my-anthropic',
  id: 'connection:my-anthropic',
  type: 'Anthropic',
  properties: { apiKey: 'sk-test' },
};

function createContext({ user = { id: 'user_1' }, configs = {}, resolver } = {}) {
  const files = {
    'mcp.json': mcpJson,
    'api/get-customer.json': endpointConfig,
    'agents/support-bot.json': agentConfig,
    'connections/my-anthropic.json': connectionConfig,
    ...configs,
  };
  const readConfigFile = jest.fn((path) => files[path] ?? null);
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: jest.fn().mockReturnValue({ provider: 'mock-provider' }), requests: {} },
    },
    user,
  });
  context.agents = {
    ClaudeAgent: {
      resolver: resolver ?? jest.fn().mockResolvedValue({ result: { text: 'Agent reply' } }),
      schema: {},
    },
  };
  return context;
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
    configs: { 'mcp.json': { configured: false, endpoints: [], agents: [] } },
  });
  const server = await createMcpServer({ context });
  expect(server).toBe(null);
});

test('tools/list returns endpoint and agent tools for an authorized caller', async () => {
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
    {
      name: 'support-bot',
      description: 'Answers support questions.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The task or question for the agent.' },
        },
        required: ['prompt'],
      },
    },
  ]);
});

test('tools/list filters tools the caller is not authorized for', async () => {
  const context = createContext({
    user: null,
    configs: {
      'api/get-customer.json': { ...endpointConfig, auth: { public: false } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const { tools } = await client.listTools();
  expect(tools.map((t) => t.name)).toEqual(['support-bot']);
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

test('tools/call runs an agent headlessly and returns its text', async () => {
  const resolver = jest.fn().mockResolvedValue({ result: { text: 'Agent reply' } });
  const context = createContext({ resolver });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({
    name: 'support-bot',
    arguments: { prompt: 'Help me' },
  });
  expect(result.isError).toBeFalsy();
  expect(result.content[0].text).toBe('Agent reply');
  expect(resolver.mock.calls[0][0].properties.prompt).toBe('Help me');
  expect(resolver.mock.calls[0][0].context.mode).toBe('generate');
});

test('tools/call returns an error result for an unknown tool', async () => {
  const context = createContext();
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'nope', arguments: {} });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toBe('Unknown tool "nope".');
});

test('tools/call returns an error result when authorization denies the agent', async () => {
  const context = createContext({
    user: null,
    configs: {
      'agents/support-bot.json': { ...agentConfig, auth: { public: false } },
    },
  });
  const server = await createMcpServer({ context });
  const client = await connectClient(server);

  const result = await client.callTool({ name: 'support-bot', arguments: { prompt: 'Hi' } });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toBe('Authentication required for agent "support-bot".');
});
