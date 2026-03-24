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
import { ConfigError } from '@lowdefy/errors';

import callAgent from './callAgent.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

function createMockReadConfigFile({ agentConfig, connectionConfig, endpointConfigs }) {
  return jest.fn((path) => {
    if (path === `agents/${agentConfig?.agentId}.json`) {
      return agentConfig;
    }
    if (path === `connections/${agentConfig?.connectionId}.json`) {
      return connectionConfig;
    }
    if (endpointConfigs) {
      for (const [id, config] of Object.entries(endpointConfigs)) {
        if (path === `api/${id}.json`) {
          return config;
        }
      }
    }
    return null;
  });
}

test('callAgent loads agent config, creates connection, and calls resolver', async () => {
  const mockStream = { toUIMessageStreamResponse: jest.fn() };
  const mockResolver = jest.fn().mockResolvedValue(mockStream);
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: [],
    properties: { model: 'claude-3-5-sonnet', instructions: 'Be helpful.' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: { apiKey: 'sk-test' },
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  const messages = [{ role: 'user', content: 'Hello' }];
  const result = await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages,
  });

  expect(readConfigFile).toHaveBeenCalledWith('agents/my-agent.json');
  expect(readConfigFile).toHaveBeenCalledWith('connections/my-anthropic.json');
  expect(mockCreate).toHaveBeenCalledWith({ connection: { apiKey: 'sk-test' } });
  expect(mockResolver).toHaveBeenCalledWith({
    connection: { provider: 'mock-provider' },
    properties: { agent: agentConfig, messages },
    context: expect.objectContaining({
      callEndpoint: expect.any(Function),
      getEndpointConfig: expect.any(Function),
    }),
  });
  expect(result).toBe(mockStream);
});

test('callAgent throws ConfigError when agent does not exist', async () => {
  const readConfigFile = jest.fn().mockReturnValue(null);
  const context = testContext({
    logger,
    readConfigFile,
    session: { user: { id: 'user_1' } },
  });
  context.agents = {};

  await expect(
    callAgent(context, {
      agentId: 'non-existent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow(ConfigError);
  await expect(
    callAgent(context, {
      agentId: 'non-existent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow('Agent "non-existent" does not exist.');
});

test('callAgent throws ConfigError when agent type not found in registry', async () => {
  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'UnknownAgent',
    connectionId: 'my-conn',
    properties: {},
  };
  const connectionConfig = {
    connectionId: 'my-conn',
    id: 'connection:my-conn',
    type: 'SomeConnection',
    properties: {},
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      SomeConnection: { create: jest.fn().mockReturnValue({}), requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = {};

  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow(ConfigError);
  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow('Agent type "UnknownAgent" can not be found.');
});

test('callAgent throws when connection type not found in registry', async () => {
  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-conn',
    properties: {},
  };
  const connectionConfig = {
    connectionId: 'my-conn',
    id: 'connection:my-conn',
    type: 'MissingConnection',
    properties: {},
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {},
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: jest.fn(), schema: {} } };

  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow(ConfigError);
  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow('Connection type "MissingConnection" can not be found.');
});

test('callAgent resolver context callEndpoint executes endpoint routine', async () => {
  let capturedResolverContext;
  const mockResolver = jest.fn().mockImplementation(({ context: resolverCtx }) => {
    capturedResolverContext = resolverCtx;
    return { toUIMessageStreamResponse: jest.fn() };
  });
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: ['search'],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };
  const endpointConfigs = {
    search: {
      endpointId: 'search',
      type: 'Api',
      auth: { public: true },
      description: 'Search endpoint',
      payloadSchema: { type: 'object' },
      routine: { ':return': 'search-results' },
    },
  };

  const readConfigFile = createMockReadConfigFile({
    agentConfig,
    connectionConfig,
    endpointConfigs,
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages: [],
  });

  // Call the callEndpoint on the resolver context
  const endpointResult = await capturedResolverContext.callEndpoint('search', {
    payload: { query: 'test' },
  });
  expect(endpointResult.success).toBe(true);
  expect(endpointResult.status).toBe('success');
});

test('callAgent resolver context getEndpointConfig returns endpoint config', async () => {
  let capturedResolverContext;
  const mockResolver = jest.fn().mockImplementation(({ context: resolverCtx }) => {
    capturedResolverContext = resolverCtx;
    return { toUIMessageStreamResponse: jest.fn() };
  });
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: ['search'],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };
  const endpointConfigs = {
    search: {
      endpointId: 'search',
      type: 'Api',
      auth: { public: true },
      description: 'Search endpoint',
      payloadSchema: { type: 'object', properties: { query: { type: 'string' } } },
      routine: [],
    },
  };

  const readConfigFile = createMockReadConfigFile({
    agentConfig,
    connectionConfig,
    endpointConfigs,
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages: [],
  });

  const config = await capturedResolverContext.getEndpointConfig({ endpointId: 'search' });
  expect(config.endpointId).toBe('search');
  expect(config.description).toBe('Search endpoint');
  expect(config.payloadSchema).toEqual({
    type: 'object',
    properties: { query: { type: 'string' } },
  });
});

test('callAgent resolver context callEndpoint allows InternalApi endpoints', async () => {
  let capturedResolverContext;
  const mockResolver = jest.fn().mockImplementation(({ context: resolverCtx }) => {
    capturedResolverContext = resolverCtx;
    return { toUIMessageStreamResponse: jest.fn() };
  });
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: ['internal-tool'],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };
  const endpointConfigs = {
    'internal-tool': {
      endpointId: 'internal-tool',
      type: 'InternalApi',
      auth: { public: true },
      description: 'Internal tool',
      payloadSchema: { type: 'object' },
      routine: { ':return': 'internal-result' },
    },
  };

  const readConfigFile = createMockReadConfigFile({
    agentConfig,
    connectionConfig,
    endpointConfigs,
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages: [],
  });

  // InternalApi endpoints should work through agent callEndpoint (not blocked)
  const endpointResult = await capturedResolverContext.callEndpoint('internal-tool', {
    payload: {},
  });
  expect(endpointResult.success).toBe(true);
  expect(endpointResult.status).toBe('success');
});

test('callAgent propagates error when connection.create throws', async () => {
  const mockCreate = jest.fn().mockImplementation(() => {
    throw new Error('Invalid API key');
  });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: [],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: { apiKey: 'sk-invalid' },
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: jest.fn(), schema: {} } };

  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow('Invalid API key');
});

test('callAgent propagates error when resolver throws', async () => {
  const mockResolver = jest.fn().mockRejectedValue(new Error('Model not available'));
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: [],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await expect(
    callAgent(context, {
      agentId: 'my-agent',
      pageId: 'my-page',
      messages: [],
    })
  ).rejects.toThrow('Model not available');
});

test('callAgent resolver context callEndpoint returns error when routine fails', async () => {
  let capturedResolverContext;
  const mockResolver = jest.fn().mockImplementation(({ context: resolverCtx }) => {
    capturedResolverContext = resolverCtx;
    return { toUIMessageStreamResponse: jest.fn() };
  });
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: ['failing-tool'],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };
  const endpointConfigs = {
    'failing-tool': {
      endpointId: 'failing-tool',
      type: 'Api',
      auth: { public: true },
      description: 'Failing endpoint',
      payloadSchema: { type: 'object' },
      routine: { ':throw': 'Something went wrong' },
    },
  };

  const readConfigFile = createMockReadConfigFile({
    agentConfig,
    connectionConfig,
    endpointConfigs,
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages: [],
  });

  const endpointResult = await capturedResolverContext.callEndpoint('failing-tool', {
    payload: {},
  });
  expect(endpointResult.success).toBe(false);
  expect(endpointResult.status).not.toBe('success');
});

test('callAgent resolver context getEndpointConfig throws for missing endpoint', async () => {
  let capturedResolverContext;
  const mockResolver = jest.fn().mockImplementation(({ context: resolverCtx }) => {
    capturedResolverContext = resolverCtx;
    return { toUIMessageStreamResponse: jest.fn() };
  });
  const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

  const agentConfig = {
    agentId: 'my-agent',
    id: 'agent:my-agent',
    type: 'ClaudeAgent',
    connectionId: 'my-anthropic',
    tools: [],
    properties: { model: 'claude-3-5-sonnet' },
  };
  const connectionConfig = {
    connectionId: 'my-anthropic',
    id: 'connection:my-anthropic',
    type: 'Anthropic',
    properties: {},
  };

  const readConfigFile = createMockReadConfigFile({ agentConfig, connectionConfig });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: mockCreate, requests: {} },
    },
    session: { user: { id: 'user_1' } },
  });
  context.agents = { ClaudeAgent: { resolver: mockResolver, schema: {} } };

  await callAgent(context, {
    agentId: 'my-agent',
    pageId: 'my-page',
    messages: [],
  });

  await expect(
    capturedResolverContext.getEndpointConfig({ endpointId: 'non-existent' })
  ).rejects.toThrow();
});
