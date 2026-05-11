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
const mockHasToolCall = jest.fn((name) => ({ type: 'hasToolCall', toolName: name }));

function createMockReadableStream(chunks = []) {
  return {
    getReader: () => {
      let index = 0;
      return {
        read: jest.fn().mockImplementation(async () => {
          if (index < chunks.length) {
            return { done: false, value: chunks[index++] };
          }
          return { done: true };
        }),
      };
    },
  };
}

const mockWriter = {
  write: jest.fn(),
};
const mockCreateAgentUIStream = jest
  .fn()
  .mockImplementation(async () => createMockReadableStream());
const mockCreateUIMessageStream = jest.fn().mockImplementation(({ execute }) => {
  mockCreateUIMessageStream._lastExecute = execute;
  return { type: 'readable-stream' };
});
const mockCreateUIMessageStreamResponse = jest.fn().mockReturnValue({ type: 'web-response' });

let lastAgentConfig = null;
let lastAgentInstance = null;
const mockToUIMessageStream = jest.fn().mockImplementation(() => createMockReadableStream());
class MockToolLoopAgent {
  constructor(config) {
    this.config = config;
    this.tools = config.tools;
    lastAgentConfig = config;
    lastAgentInstance = this;
  }

  stream = jest.fn().mockResolvedValue({
    toUIMessageStream: mockToUIMessageStream,
  });
}

const mockConvertToModelMessages = jest.fn().mockResolvedValue([]);
const mockPruneMessages = jest.fn().mockReturnValue([]);
const mockValidateUIMessages = jest.fn().mockResolvedValue([]);

jest.unstable_mockModule('ai', () => ({
  ToolLoopAgent: MockToolLoopAgent,
  convertToModelMessages: mockConvertToModelMessages,
  createAgentUIStream: mockCreateAgentUIStream,
  createUIMessageStream: mockCreateUIMessageStream,
  createUIMessageStreamResponse: mockCreateUIMessageStreamResponse,
  pruneMessages: mockPruneMessages,
  tool: mockTool,
  jsonSchema: mockJsonSchema,
  stepCountIs: mockStepCountIs,
  hasToolCall: mockHasToolCall,
  validateUIMessages: mockValidateUIMessages,
}));

const mockCreateMCPClient = jest.fn();
jest.unstable_mockModule('@ai-sdk/mcp', () => ({
  createMCPClient: mockCreateMCPClient,
}));

const mockBuildUpdatePageStateTool = jest.fn();
jest.unstable_mockModule('./buildUpdatePageStateTool.js', () => ({
  default: mockBuildUpdatePageStateTool,
}));

class MockStdioMCPTransport {
  constructor(config) {
    this.config = config;
  }
}
jest.unstable_mockModule('@ai-sdk/mcp/mcp-stdio', () => ({
  Experimental_StdioMCPTransport: MockStdioMCPTransport,
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
  expect(mockCreateUIMessageStream).toHaveBeenCalledWith({
    execute: expect.any(Function),
  });
  expect(mockCreateUIMessageStreamResponse).toHaveBeenCalledWith({
    stream: { type: 'readable-stream' },
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
        },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.experimental_onToolCallFinish).toEqual(expect.any(Function));
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
        hooks: { onStepFinish: ['log-step'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const onStepFinish = lastAgentConfig.onStepFinish;
  onStepFinish({
    stepType: 'tool-result',
    usage: { totalTokens: 100 },
    messages: [{ role: 'user', content: 'hi' }],
    abortSignal: new AbortController().signal,
  });

  expect(callEndpoint).toHaveBeenCalledWith('log-step', {
    payload: {
      stepType: 'tool-result',
      usage: { totalTokens: 100 },
    },
  });
});

test('non-onFinish hook callbacks strip messages from event payload', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onStepFinish: ['log-step'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const onStepFinish = lastAgentConfig.onStepFinish;
  onStepFinish({
    stepType: 'tool-result',
    messages: [{ role: 'user', content: 'hi' }],
    abortSignal: new AbortController().signal,
  });

  expect(callEndpoint).toHaveBeenCalledWith('log-step', {
    payload: { stepType: 'tool-result' },
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
        hooks: { onStepFinish: ['failing-endpoint'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const onStepFinish = lastAgentConfig.onStepFinish;
  // Should not throw
  expect(() => onStepFinish({ stepType: 'tool-result' })).not.toThrow();
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

  // MCP cleanup happens inside the execute function
  const execute = mockCreateUIMessageStream._lastExecute;
  expect(execute).toEqual(expect.any(Function));
  await execute({ writer: mockWriter });
  expect(mockClose).toHaveBeenCalled();
});

test('stdio MCP source creates StdioMCPTransport with command and args', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  const mockClient = {
    tools: jest.fn().mockResolvedValue({ 'aws-docs': { description: 'Search AWS docs' } }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        mcp: [
          {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@awslabs/aws-documentation-mcp-server'],
            env: { AWS_REGION: 'us-east-1' },
          },
        ],
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

  expect(mockCreateMCPClient).toHaveBeenCalledWith({
    transport: expect.any(MockStdioMCPTransport),
  });
  const transport = mockCreateMCPClient.mock.calls[0][0].transport;
  expect(transport.config.command).toBe('npx');
  expect(transport.config.args).toEqual(['-y', '@awslabs/aws-documentation-mcp-server']);
  expect(transport.config.env).toEqual(expect.objectContaining({ AWS_REGION: 'us-east-1' }));
  expect(lastAgentConfig.tools['aws-docs']).toBeDefined();
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

test('MCP tool listing failure logs warning and continues', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);
  const mockClient = {
    tools: jest.fn().mockRejectedValue(new Error('Tool listing timed out')),
    close: jest.fn().mockResolvedValue(undefined),
  };
  mockCreateMCPClient.mockResolvedValue(mockClient);
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const result = await handleAgentChat({
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

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('tool listing failed'));
  expect(result.response).toEqual({ type: 'web-response' });
  consoleSpy.mockRestore();
});

test('stream-level onFinish calls hook endpoints with messages payload', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });
  const messages = [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }];

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['save-conversation'] },
        properties: { model: 'gpt-4o' },
      },
      messages,
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  expect(execute).toEqual(expect.any(Function));

  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(callEndpoint).toHaveBeenCalledWith('save-conversation', {
    payload: expect.objectContaining({
      messages,
      steps: [],
      toolResults: [],
      finishReason: 'stop',
      isAborted: false,
    }),
  });
});

test('no onFinish hooks does not call callEndpoint in execute', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn();

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(callEndpoint).not.toHaveBeenCalled();
  expect(localWriter.write).not.toHaveBeenCalled();
});

test('onFinish hook dataParts are written to the stream writer', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const dataParts = [
    { type: 'data', value: { suggestions: ['How are you?'] } },
    { type: 'data', value: { title: 'Greeting conversation' } },
  ];
  const callEndpoint = jest.fn().mockResolvedValue({ response: { dataParts } });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['generate-suggestions'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(localWriter.write).toHaveBeenCalledTimes(2);
  expect(localWriter.write).toHaveBeenNthCalledWith(1, dataParts[0]);
  expect(localWriter.write).toHaveBeenNthCalledWith(2, dataParts[1]);
});

test('onFinish hook failure logs warning and continues to next hook', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest
    .fn()
    .mockRejectedValueOnce(new Error('Network timeout'))
    .mockResolvedValueOnce({ response: { dataParts: [{ type: 'data', value: { ok: true } }] } });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['failing-hook', 'succeeding-hook'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(callEndpoint).toHaveBeenCalledTimes(2);
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('onFinish hook "failing-hook" failed')
  );
  expect(localWriter.write).toHaveBeenCalledTimes(1);
  expect(localWriter.write).toHaveBeenCalledWith({ type: 'data', value: { ok: true } });
  consoleSpy.mockRestore();
});

test('onFinish hook without dataParts does not write to stream', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['save-conversation'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(callEndpoint).toHaveBeenCalledWith('save-conversation', expect.any(Object));
  expect(localWriter.write).not.toHaveBeenCalled();
});

test('stopOnToolCall with single string creates array stopWhen', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', stopOnToolCall: 'submit_form' },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(mockHasToolCall).toHaveBeenCalledWith('submit_form');
  expect(lastAgentConfig.stopWhen).toEqual([
    { type: 'stepCount', count: 10 },
    { type: 'hasToolCall', toolName: 'submit_form' },
  ]);
});

test('stopOnToolCall with array creates stopWhen with multiple conditions', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', stopOnToolCall: ['submit_form', 'cancel'] },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(mockHasToolCall).toHaveBeenCalledWith('submit_form');
  expect(mockHasToolCall).toHaveBeenCalledWith('cancel');
  expect(lastAgentConfig.stopWhen).toEqual([
    { type: 'stepCount', count: 10 },
    { type: 'hasToolCall', toolName: 'submit_form' },
    { type: 'hasToolCall', toolName: 'cancel' },
  ]);
});

test('no stopOnToolCall produces single stopWhen condition', async () => {
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

  expect(lastAgentConfig.stopWhen).toEqual({ type: 'stepCount', count: 10 });
});

test('activeTools passed to ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', activeTools: ['search', 'write'] },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.activeTools).toEqual(['search', 'write']);
});

test('sampling parameters passed to ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          topP: 0.9,
          topK: 40,
          frequencyPenalty: 0.5,
          presencePenalty: -0.3,
          seed: 42,
        },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.topP).toBe(0.9);
  expect(lastAgentConfig.topK).toBe(40);
  expect(lastAgentConfig.frequencyPenalty).toBe(0.5);
  expect(lastAgentConfig.presencePenalty).toBe(-0.3);
  expect(lastAgentConfig.seed).toBe(42);
});

test('stopSequences passed to ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', stopSequences: ['END', 'STOP'] },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.stopSequences).toEqual(['END', 'STOP']);
});

test('maxRetries passed to ToolLoopAgent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', maxRetries: 5 },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.maxRetries).toBe(5);
});

test('timeout as number passed to createAgentUIStream', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', timeout: 30000 },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(mockCreateAgentUIStream).toHaveBeenCalledWith(expect.objectContaining({ timeout: 30000 }));
});

test('timeout as object passed to createAgentUIStream', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const timeout = { totalMs: 60000, stepMs: 10000 };

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', timeout },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  expect(mockCreateAgentUIStream).toHaveBeenCalledWith(
    expect.objectContaining({ timeout: { totalMs: 60000, stepMs: 10000 } })
  );
});

test('no timeout omits key from createAgentUIStream', async () => {
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

  const execute = mockCreateUIMessageStream._lastExecute;
  const localWriter = { write: jest.fn() };
  await execute({ writer: localWriter });

  const streamCallArgs =
    mockCreateAgentUIStream.mock.calls[mockCreateAgentUIStream.mock.calls.length - 1][0];
  expect(streamCallArgs).not.toHaveProperty('timeout');
});

test('undefined new properties do not break agent creation', async () => {
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

  expect(lastAgentConfig.activeTools).toBeUndefined();
  expect(lastAgentConfig.topP).toBeUndefined();
  expect(lastAgentConfig.topK).toBeUndefined();
  expect(lastAgentConfig.frequencyPenalty).toBeUndefined();
  expect(lastAgentConfig.presencePenalty).toBeUndefined();
  expect(lastAgentConfig.seed).toBeUndefined();
  expect(lastAgentConfig.stopSequences).toBeUndefined();
  expect(lastAgentConfig.maxRetries).toBeUndefined();
});

test('tool execute passes abortSignal to callEndpoint', async () => {
  mockJsonSchema.mockImplementation((schema) => schema);
  mockTool.mockImplementation((def) => def);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Signal test',
    payloadSchema: { type: 'object' },
  });
  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: { ok: true } });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: { tools: [{ endpointId: 'signal-test' }], properties: { model: 'gpt-4o' } },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig },
  });

  const toolDef = mockTool.mock.calls[0][0];
  const mockSignal = new AbortController().signal;
  await toolDef.execute({ query: 'test' }, { abortSignal: mockSignal });

  expect(callEndpoint).toHaveBeenCalledWith('signal-test', {
    payload: { query: 'test' },
    abortSignal: mockSignal,
  });
});

test('repairToolCall is passed to ToolLoopAgent when enabled', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', repairToolCall: true },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  expect(lastAgentConfig.experimental_repairToolCall).toEqual(expect.any(Function));
});

test('repairToolCall is not set when not configured', async () => {
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

  expect(lastAgentConfig.experimental_repairToolCall).toBeUndefined();
});

test('onFinish hook receives original input messages in payload', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });
  const inputMessages = [{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] }];

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['save-conversation'] },
        properties: { model: 'gpt-4o' },
      },
      messages: inputMessages,
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  // Execute the stream to trigger onFinish
  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  expect(callEndpoint).toHaveBeenCalledWith('save-conversation', {
    payload: expect.objectContaining({
      messages: inputMessages,
      finishReason: 'stop',
      isAborted: false,
    }),
  });
});

test('onFinish hook payload includes agentContext fields', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });
  const messages = [{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }];
  const agentContext = {
    conversationId: 'conv_123',
    pageId: 'my-page',
    urlQuery: { principle_id: 'P3' },
    userId: 'user_abc',
  };

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['save-conversation'] },
        properties: { model: 'gpt-4o' },
      },
      messages,
    },
    context: { callEndpoint, getEndpointConfig: jest.fn(), agentContext },
  });

  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  expect(callEndpoint).toHaveBeenCalledWith('save-conversation', {
    payload: expect.objectContaining({
      conversationId: 'conv_123',
      pageId: 'my-page',
      urlQuery: { principle_id: 'P3' },
      userId: 'user_abc',
    }),
  });
});

test('onFinish hook payload includes aggregated usage from multiple steps', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  // Mock createAgentUIStream to simulate multiple steps completing during execution
  mockCreateAgentUIStream.mockImplementation(async (opts) => {
    if (opts.onStepFinish) {
      opts.onStepFinish({
        stepNumber: 0,
        text: 'Looking up products...',
        toolCalls: [{ toolCallId: 'tc1', toolName: 'search', input: { q: 'laptop' } }],
        toolResults: [{ toolCallId: 'tc1', toolName: 'search', input: { q: 'laptop' }, output: [{ name: 'MacBook' }] }],
        finishReason: 'tool-calls',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          inputTokenDetails: { cacheReadTokens: 20, cacheWriteTokens: 10 },
          outputTokenDetails: { reasoningTokens: 5 },
        },
      });
      opts.onStepFinish({
        stepNumber: 1,
        text: 'Here are the results.',
        toolCalls: [],
        toolResults: [],
        finishReason: 'stop',
        usage: {
          inputTokens: 200,
          outputTokens: 80,
          totalTokens: 280,
          inputTokenDetails: { cacheReadTokens: 30, cacheWriteTokens: 0 },
          outputTokenDetails: { reasoningTokens: 12 },
        },
      });
    }
    return createMockReadableStream();
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['track-usage'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  expect(callEndpoint).toHaveBeenCalledWith('track-usage', {
    payload: expect.objectContaining({
      usage: {
        inputTokens: 300,
        outputTokens: 130,
        totalTokens: 430,
        reasoningTokens: 17,
        cacheReadTokens: 50,
        cacheWriteTokens: 10,
      },
    }),
  });

  // Restore default mock
  mockCreateAgentUIStream.mockImplementation(async () => createMockReadableStream());
});

test('usage accumulator handles missing usage gracefully', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  mockCreateAgentUIStream.mockImplementation(async (opts) => {
    if (opts.onStepFinish) {
      opts.onStepFinish({ usage: undefined });
      opts.onStepFinish({ usage: { inputTokens: 50 } });
    }
    return createMockReadableStream();
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['track-usage'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  expect(callEndpoint).toHaveBeenCalledWith('track-usage', {
    payload: expect.objectContaining({
      usage: {
        inputTokens: 50,
        outputTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    }),
  });

  // Restore default mocks
  mockCreateAgentUIStream.mockImplementation(async () => createMockReadableStream());
});

test('pageContext true prepends context block to instructions', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          instructions: 'You are a governance advisor.',
          pageContext: true,
        },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      agentContext: {
        pageId: 'principle-view',
        userId: 'user_abc',
        conversationId: 'conv_123',
        urlQuery: { principle_id: 'P3' },
      },
    },
  });

  expect(lastAgentConfig.instructions).toBe(
    '<context>\n' +
      '  pageId: principle-view\n' +
      '  userId: user_abc\n' +
      '  conversationId: conv_123\n' +
      '  urlQuery: {"principle_id":"P3"}\n' +
      '</context>\n' +
      '\n' +
      'You are a governance advisor.'
  );
});

test('pageContext false does not modify instructions', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          instructions: 'Be helpful.',
        },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      agentContext: { pageId: 'some-page', userId: 'user_1' },
    },
  });

  expect(lastAgentConfig.instructions).toBe('Be helpful.');
});

test('pageContext omits empty urlQuery from context block', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          instructions: 'Be helpful.',
          pageContext: true,
        },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      agentContext: { pageId: 'my-page', userId: 'user_1', urlQuery: {} },
    },
  });

  expect(lastAgentConfig.instructions).not.toContain('urlQuery');
  expect(lastAgentConfig.instructions).toContain('<context>');
  expect(lastAgentConfig.instructions).toContain('pageId: my-page');
});

test('pageContext includes sharedState in context block', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          instructions: 'Be helpful.',
          pageContext: true,
        },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      agentContext: {
        pageId: 'onboarding',
        userId: 'user_abc',
        sharedState: { org_name: 'TestCorp', sector: 'private_security' },
      },
    },
  });

  expect(lastAgentConfig.instructions).toContain(
    'sharedState: {"org_name":"TestCorp","sector":"private_security"}'
  );
  expect(lastAgentConfig.instructions).toContain('<context>');
});

test('pageContext omits empty sharedState from context block', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: {
          model: 'gpt-4o',
          instructions: 'Be helpful.',
          pageContext: true,
        },
      },
      messages: [],
    },
    context: {
      callEndpoint: jest.fn(),
      getEndpointConfig: jest.fn(),
      agentContext: { pageId: 'my-page', userId: 'user_1', sharedState: {} },
    },
  });

  expect(lastAgentConfig.instructions).not.toContain('sharedState');
});

test('merges update-page-state tool when sharedState is present on agentContext', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  const sentinelTool = { __sentinel: 'update-page-state-tool' };
  mockBuildUpdatePageStateTool.mockReset();
  mockBuildUpdatePageStateTool.mockReturnValue(sentinelTool);

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
      agentContext: {
        pageId: 'p1',
        userId: 'u1',
        sharedState: { org_name: 'Acme' },
      },
    },
  });

  expect(mockBuildUpdatePageStateTool).toHaveBeenCalledWith({
    sharedState: { org_name: 'Acme' },
  });
  expect(lastAgentConfig.tools['update-page-state']).toBe(sentinelTool);
});

test('does not merge update-page-state tool when sharedState is absent', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  mockBuildUpdatePageStateTool.mockReset();
  mockBuildUpdatePageStateTool.mockReturnValue(null);

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
      // no agentContext.sharedState
    },
  });

  expect(lastAgentConfig.tools['update-page-state']).toBeUndefined();
});

test('onFinish hook payload includes steps with toolCalls and toolResults', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  const mockToolCall = { toolCallId: 'tc1', toolName: 'set_form', input: { name: 'Acme' } };
  const mockToolResult = { ...mockToolCall, output: { success: true } };

  mockCreateAgentUIStream.mockImplementation(async (opts) => {
    if (opts.onStepFinish) {
      opts.onStepFinish({
        stepNumber: 0,
        text: 'Setting form fields.',
        toolCalls: [mockToolCall],
        toolResults: [mockToolResult],
        finishReason: 'stop',
        usage: { inputTokens: 50, outputTokens: 20, totalTokens: 70 },
      });
    }
    return createMockReadableStream();
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['process-results'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  const payload = callEndpoint.mock.calls[0][1].payload;

  expect(payload.steps).toEqual([
    {
      stepNumber: 0,
      text: 'Setting form fields.',
      toolCalls: [mockToolCall],
      toolResults: [mockToolResult],
      finishReason: 'stop',
    },
  ]);
  expect(payload.toolResults).toEqual([mockToolResult]);

  mockCreateAgentUIStream.mockImplementation(async () => createMockReadableStream());
});

test('onFinish hook payload has empty toolResults when no tools called', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const callEndpoint = jest.fn().mockResolvedValue({ success: true, response: {} });

  mockCreateAgentUIStream.mockImplementation(async (opts) => {
    if (opts.onStepFinish) {
      opts.onStepFinish({
        stepNumber: 0,
        text: 'Hello!',
        toolCalls: [],
        toolResults: [],
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      });
    }
    return createMockReadableStream();
  });

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        hooks: { onFinish: ['save'] },
        properties: { model: 'gpt-4o' },
      },
      messages: [],
    },
    context: { callEndpoint, getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({ writer: mockWriter });

  const payload = callEndpoint.mock.calls[0][1].payload;

  expect(payload.steps).toHaveLength(1);
  expect(payload.steps[0].text).toBe('Hello!');
  expect(payload.toolResults).toEqual([]);

  mockCreateAgentUIStream.mockImplementation(async () => createMockReadableStream());
});

test('prune config triggers decomposed stream pipeline instead of createAgentUIStream', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  mockCreateAgentUIStream.mockClear();
  mockValidateUIMessages.mockClear();
  mockConvertToModelMessages.mockClear();
  mockPruneMessages.mockClear();
  mockToUIMessageStream.mockClear();

  const mockValidated = [{ role: 'user', content: 'validated' }];
  const mockModel = [{ role: 'user', content: 'model' }];
  const mockPruned = [{ role: 'user', content: 'pruned' }];
  mockValidateUIMessages.mockResolvedValue(mockValidated);
  mockConvertToModelMessages.mockResolvedValue(mockModel);
  mockPruneMessages.mockReturnValue(mockPruned);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const messages = [{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] }];
  const pruneConfig = { reasoning: 'all', toolCalls: 'before-last-message' };

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', prune: pruneConfig },
      },
      messages,
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  const localWriter = { write: jest.fn() };
  await mockCreateUIMessageStream._lastExecute({ writer: localWriter });

  expect(mockValidateUIMessages).toHaveBeenCalledWith({
    messages,
    tools: lastAgentInstance.tools,
  });
  expect(mockConvertToModelMessages).toHaveBeenCalledWith(mockValidated, {
    tools: lastAgentInstance.tools,
  });
  expect(mockPruneMessages).toHaveBeenCalledWith({
    messages: mockModel,
    ...pruneConfig,
  });
  expect(lastAgentInstance.stream).toHaveBeenCalledWith({
    prompt: mockPruned,
    onStepFinish: expect.any(Function),
  });
  expect(mockToUIMessageStream).toHaveBeenCalledWith({
    originalMessages: mockValidated,
  });
  expect(mockCreateAgentUIStream).not.toHaveBeenCalled();
});

test('without prune config, createAgentUIStream is used and prune functions are not called', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  mockCreateAgentUIStream.mockClear();
  mockValidateUIMessages.mockClear();
  mockConvertToModelMessages.mockClear();
  mockPruneMessages.mockClear();

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o' },
      },
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  const localWriter = { write: jest.fn() };
  await mockCreateUIMessageStream._lastExecute({ writer: localWriter });

  expect(mockCreateAgentUIStream).toHaveBeenCalled();
  expect(mockValidateUIMessages).not.toHaveBeenCalled();
  expect(mockConvertToModelMessages).not.toHaveBeenCalled();
  expect(mockPruneMessages).not.toHaveBeenCalled();
});

test('all pruneConfig properties are spread into pruneMessages call', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  mockPruneMessages.mockClear();
  mockValidateUIMessages.mockResolvedValue([]);
  mockConvertToModelMessages.mockResolvedValue([]);
  mockPruneMessages.mockReturnValue([]);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  const pruneConfig = {
    reasoning: 'before-last-message',
    toolCalls: 'all',
    emptyMessages: 'remove',
  };

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', prune: pruneConfig },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({
    writer: { write: jest.fn() },
  });

  expect(mockPruneMessages).toHaveBeenCalledWith({
    messages: [],
    reasoning: 'before-last-message',
    toolCalls: 'all',
    emptyMessages: 'remove',
  });
});

test('prune branch passes timeout to agentInstance.stream', async () => {
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockReturnValue(MOCK_SCHEMA);
  mockValidateUIMessages.mockResolvedValue([]);
  mockConvertToModelMessages.mockResolvedValue([]);
  mockPruneMessages.mockReturnValue([]);

  const { default: handleAgentChat } = await import('./handleAgentChat.js');

  await handleAgentChat({
    connection: { provider: jest.fn().mockReturnValue({}) },
    properties: {
      agent: {
        tools: [],
        properties: { model: 'gpt-4o', prune: { reasoning: 'all' }, timeout: 30000 },
      },
      messages: [],
    },
    context: { callEndpoint: jest.fn(), getEndpointConfig: jest.fn() },
  });

  await mockCreateUIMessageStream._lastExecute({
    writer: { write: jest.fn() },
  });

  expect(lastAgentInstance.stream).toHaveBeenCalledWith({
    prompt: [],
    timeout: 30000,
    onStepFinish: expect.any(Function),
  });
});
