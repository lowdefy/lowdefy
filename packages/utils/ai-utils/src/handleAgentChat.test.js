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

const mockTool = jest.fn();
const mockJsonSchema = jest.fn();
const mockStepCountIs = jest.fn((n) => ({ type: 'stepCount', count: n }));
const mockCreateAgentUIStreamResponse = jest.fn().mockReturnValue({ type: 'web-response' });

let lastAgentConfig = null;
class MockToolLoopAgent {
  constructor(config) {
    this.config = config;
    lastAgentConfig = config;
  }
}

jest.unstable_mockModule('ai', () => ({
  ToolLoopAgent: MockToolLoopAgent,
  createAgentUIStreamResponse: mockCreateAgentUIStreamResponse,
  tool: mockTool,
  jsonSchema: mockJsonSchema,
  stepCountIs: mockStepCountIs,
}));

const mockCreateMCPClient = jest.fn();
jest.unstable_mockModule('@ai-sdk/mcp', () => ({
  createMCPClient: mockCreateMCPClient,
}));

const MOCK_SCHEMA = { type: 'object', properties: {} };

test('creates ToolLoopAgent with correct parameters', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const mockModel = {};
  const provider = jest.fn().mockReturnValue(mockModel);
  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Search tool',
    payloadSchema: { type: 'object', properties: { query: { type: 'string' } } },
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: { result: 'ok' } });

  const messages = [{ role: 'user', content: 'Hello' }];
  const agent = {
    tools: [{ endpointId: 'search' }],
    properties: {
      model: 'claude-3-5-sonnet',
      instructions: 'You are a helpful assistant.',
      maxSteps: 5,
      maxOutputTokens: 1024,
      temperature: 0.7,
      toolChoice: 'required',
    },
  };

  const result = await handleAgentChat({
    connection: { provider },
    properties: { agent, messages },
    context: { callEndpoint, getEndpointConfig },
  });

  expect(provider).toHaveBeenCalledWith('claude-3-5-sonnet');
  expect(mockStepCountIs).toHaveBeenCalledWith(5);
  expect(lastAgentConfig).toEqual(
    expect.objectContaining({
      model: mockModel,
      instructions: 'You are a helpful assistant.',
      stopWhen: { type: 'stepCount', count: 5 },
      maxOutputTokens: 1024,
      temperature: 0.7,
      toolChoice: 'required',
    })
  );
  expect(mockCreateAgentUIStreamResponse).toHaveBeenCalledWith({
    agent: expect.any(MockToolLoopAgent),
    uiMessages: messages,
  });
  expect(result).toEqual({ response: { type: 'web-response' } });
});

test('builds tools from endpoint configs', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const payloadSchema = { type: 'object', properties: { query: { type: 'string' } } };
  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'A search endpoint',
    payloadSchema,
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: { hits: [] } });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'search' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  expect(getEndpointConfig).toHaveBeenCalledWith({ endpointId: 'search' });
  expect(mockJsonSchema).toHaveBeenCalledWith(payloadSchema);
  expect(mockTool).toHaveBeenCalledWith(
    expect.objectContaining({
      description: 'A search endpoint',
      inputSchema: payloadSchema,
      execute: expect.any(Function),
    })
  );

  // Verify execute calls callEndpoint correctly and cleans the response
  const toolDef = mockTool.mock.calls[0][0];
  const input = { query: 'test' };
  const executeResult = await toolDef.execute(input);
  expect(callEndpoint).toHaveBeenCalledWith('search', { payload: input });
  expect(executeResult).toEqual({ hits: [] });
});

test('uses default stopWhen and toolChoice when optional properties missing', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(mockStepCountIs).toHaveBeenCalledWith(10);
  expect(lastAgentConfig).toEqual(
    expect.objectContaining({
      stopWhen: { type: 'stepCount', count: 10 },
      toolChoice: 'auto',
    })
  );
});

test('handles agent with no tools property defined', async () => {
  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn();
  const callEndpoint = jest.fn();

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  expect(getEndpointConfig).not.toHaveBeenCalled();
  expect(lastAgentConfig.tools).toEqual({});
});

test('throws when tool endpoint execution fails with error message', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Failing endpoint',
    payloadSchema: { type: 'object' },
  });
  const callEndpoint = jest.fn().mockResolvedValue({
    success: false,
    error: { '~e': { message: 'Database connection refused', name: 'Error' } },
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'db-query' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  const toolDef = mockTool.mock.calls[0][0];
  await expect(toolDef.execute({ query: 'SELECT 1' })).rejects.toThrow(
    'Database connection refused'
  );
});

test('throws generic message when tool endpoint fails without error message', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Failing endpoint',
    payloadSchema: { type: 'object' },
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: false });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'db-query' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  const toolDef = mockTool.mock.calls[0][0];
  await expect(toolDef.execute({})).rejects.toThrow('Endpoint execution failed');
});

test('builds multiple tools from multiple endpoint configs', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest
    .fn()
    .mockResolvedValueOnce({ description: 'Search tool', payloadSchema: { type: 'object' } })
    .mockResolvedValueOnce({ description: 'Write tool', payloadSchema: { type: 'object' } });
  const callEndpoint = jest.fn();

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [{ endpointId: 'search' }, { endpointId: 'write' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  expect(getEndpointConfig).toHaveBeenCalledTimes(2);
  expect(getEndpointConfig).toHaveBeenNthCalledWith(1, { endpointId: 'search' });
  expect(getEndpointConfig).toHaveBeenNthCalledWith(2, { endpointId: 'write' });
  expect(mockTool).toHaveBeenCalledTimes(2);
  expect(Object.keys(lastAgentConfig.tools)).toEqual(['search', 'write']);
});

test('tool execute returns null when endpoint response is null', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Nullable endpoint',
    payloadSchema: { type: 'object' },
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: null });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'nullable' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  const toolDef = mockTool.mock.calls[0][0];
  const executeResult = await toolDef.execute({});
  expect(executeResult).toBeNull();
});

test('cleanBuildArtifact strips non-enumerable serializer markers from payload schema', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const payloadSchema = { type: 'object', properties: { query: { type: 'string' } } };
  Object.defineProperty(payloadSchema, '~k', { value: 'some.config.key', enumerable: false });

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Schema test endpoint',
    payloadSchema,
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'schema-test' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig },
  });

  const cleanedSchema = mockJsonSchema.mock.calls[0][0];
  expect(cleanedSchema['~k']).toBeUndefined();
  expect(cleanedSchema).toEqual({ type: 'object', properties: { query: { type: 'string' } } });
});

test('tool execute cleans build artifact markers from response', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const response = { data: 'result value', count: 42 };
  Object.defineProperty(response, '~k', { value: 'response.config.key', enumerable: false });

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Response cleaning endpoint',
    payloadSchema: { type: 'object' },
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'response-test' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  const toolDef = mockTool.mock.calls[0][0];
  const executeResult = await toolDef.execute({});
  expect(executeResult['~k']).toBeUndefined();
  expect(executeResult).toEqual({ data: 'result value', count: 42 });
});

test('providerOptions passed to ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const providerOptions = {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 12000 },
    },
  };

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'claude-3-5-sonnet', providerOptions },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.providerOptions).toEqual(providerOptions);
});

test('undefined providerOptions does not break agent creation', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.providerOptions).toBeUndefined();
});

test('hook callbacks are passed to ToolLoopAgent constructor', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: {
          onToolCallFinish: ['save-data'],
          onFinish: ['log-usage'],
        },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.experimental_onToolCallFinish).toEqual(expect.any(Function));
  expect(lastAgentConfig.onFinish).toEqual(expect.any(Function));
  expect(lastAgentConfig.experimental_onStart).toBeUndefined();
});

test('hook callback calls callEndpoint with cleaned event payload', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['log-usage'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const onFinish = lastAgentConfig.onFinish;
  onFinish({
    text: 'Hello',
    totalUsage: { totalTokens: 100 },
    messages: [{ role: 'user', content: 'hi' }],
    abortSignal: new AbortController().signal,
  });

  expect(callEndpoint).toHaveBeenCalledWith('log-usage', {
    payload: { text: 'Hello', totalUsage: { totalTokens: 100 } },
  });
});

test('hook callback errors do not propagate', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockRejectedValue(new Error('endpoint failed'));

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['failing-endpoint'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const onFinish = lastAgentConfig.onFinish;
  // Should not throw
  expect(() => onFinish({ text: 'Hello' })).not.toThrow();
});

test('no hooks produces no callbacks on ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.experimental_onStart).toBeUndefined();
  expect(lastAgentConfig.experimental_onToolCallFinish).toBeUndefined();
  expect(lastAgentConfig.onStepFinish).toBeUndefined();
  expect(lastAgentConfig.onFinish).toBeUndefined();
});

test('empty tools array produces empty tools object', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn();

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig },
  });

  expect(lastAgentConfig.tools).toEqual({});
  expect(mockTool).not.toHaveBeenCalled();
});

test('tool with confirm true sets needsApproval', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const { default: handleAgentChat } = await import('./handleAgentChat.js');
  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Dangerous tool',
    payloadSchema: { type: 'object' },
  });
  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [{ endpointId: 'dangerous', confirm: true }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig },
  });
  expect(mockTool).toHaveBeenCalledWith(expect.objectContaining({ needsApproval: true }));
});

test('tool without confirm does not set needsApproval', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const { default: handleAgentChat } = await import('./handleAgentChat.js');
  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Normal tool',
    payloadSchema: { type: 'object' },
  });
  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [{ endpointId: 'normal' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig },
  });
  expect(mockTool).toHaveBeenCalledWith(
    expect.not.objectContaining({ needsApproval: expect.anything() })
  );
});

test('creates MCP clients from agent mcp config', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  const mockClient = {
    tools: jest.fn().mockResolvedValue({ 'mcp-search': { description: 'MCP search' } }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const evaluateOperators = jest.fn((input) => input);

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        mcp: [{ url: 'https://mcp.example.com', transport: 'http' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn(), evaluateOperators },
  });

  expect(mockCreateMCPClient).toHaveBeenCalledWith({
    transport: { type: 'http', url: 'https://mcp.example.com' },
  });
  expect(lastAgentConfig.tools).toHaveProperty('mcp-search');
});

test('endpoint tools take precedence over MCP tools on name conflict', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const mockClient = {
    tools: jest.fn().mockResolvedValue({ search: { description: 'MCP search' } }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Endpoint search',
    payloadSchema: { type: 'object' },
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [{ endpointId: 'search' }],
        mcp: [{ url: 'https://mcp.example.com' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig,
      evaluateOperators: jest.fn((x) => x),
    },
  });

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MCP tool "search"'));
  consoleSpy.mockRestore();
});

test('MCP source with confirm applies needsApproval to all tools', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const mockClient = {
    tools: jest.fn().mockResolvedValue({
      'mcp-tool-a': { description: 'A' },
      'mcp-tool-b': { description: 'B' },
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const result = await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        mcp: [{ url: 'https://mcp.example.com', confirm: true }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      evaluateOperators: jest.fn((x) => x),
    },
  });

  expect(lastAgentConfig.tools['mcp-tool-a']).toEqual(
    expect.objectContaining({ needsApproval: true })
  );
});

test('unreachable MCP server logs warning and continues', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  mockCreateMCPClient.mockRejectedValue(new Error('Connection refused'));
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const result = await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        mcp: [{ url: 'https://unreachable.example.com' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      evaluateOperators: jest.fn((x) => x),
    },
  });

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unreachable'));
  expect(result.response).toEqual({ type: 'web-response' });
  consoleSpy.mockRestore();
});

test('MCP clients closed on finish', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const mockClose = jest.fn().mockResolvedValue(undefined);
  const mockClient = {
    tools: jest.fn().mockResolvedValue({ 'mcp-tool': { description: 'Tool' } }),
    close: mockClose,
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        mcp: [{ url: 'https://mcp.example.com' }],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      evaluateOperators: jest.fn((x) => x),
    },
  });

  // Trigger the composed onFinish callback
  expect(lastAgentConfig.onFinish).toEqual(expect.any(Function));
  await lastAgentConfig.onFinish({ text: 'done' });
  expect(mockClose).toHaveBeenCalled();
});

test('no mcp config produces no MCP clients', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      evaluateOperators: jest.fn((x) => x),
    },
  });

  expect(mockCreateMCPClient).not.toHaveBeenCalled();
});
