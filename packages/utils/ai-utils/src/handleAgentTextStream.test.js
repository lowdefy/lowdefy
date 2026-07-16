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

const mockTool = jest.fn((def) => def);
const mockJsonSchema = jest.fn((schema) => schema);
const mockStepCountIs = jest.fn((n) => ({ type: 'stepCount', count: n }));
const mockHasToolCall = jest.fn((name) => ({ type: 'hasToolCall', toolName: name }));
const mockGenerateText = jest.fn();
const mockStream = jest.fn();
const mockConvertToModelMessages = jest.fn().mockResolvedValue(['model-message']);
const mockPruneMessages = jest.fn().mockReturnValue(['pruned-message']);
const mockValidateUIMessages = jest.fn().mockResolvedValue(['validated-message']);

let lastAgentConfig = null;

class MockToolLoopAgent {
  constructor(config) {
    this.config = config;
    this.tools = config.tools;
    lastAgentConfig = config;
  }
  stream = mockStream;
}

jest.unstable_mockModule('ai', () => ({
  ToolLoopAgent: MockToolLoopAgent,
  convertToModelMessages: mockConvertToModelMessages,
  generateText: mockGenerateText,
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

class MockStdioMCPTransport {
  constructor(config) {
    this.config = config;
  }
}
jest.unstable_mockModule('@ai-sdk/mcp/mcp-stdio', () => ({
  Experimental_StdioMCPTransport: MockStdioMCPTransport,
}));

const STEP = {
  stepNumber: 0,
  text: 'Hello world',
  toolCalls: [],
  toolResults: [],
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
};

function mockStreamResult({ chunks = ['Hello', ' world'], steps = [STEP] } = {}) {
  mockStream.mockImplementation(async ({ onStepFinish }) => {
    if (onStepFinish) {
      for (const step of steps) {
        onStepFinish(step);
      }
    }
    return {
      textStream: (async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      })(),
      response: Promise.resolve({
        messages: [{ role: 'assistant', content: 'Hello world' }],
      }),
    };
  });
}

function createTestContext(overrides = {}) {
  return {
    mode: 'chat',
    format: 'text',
    agentContext: {
      conversationId: 'conv_1',
      pageId: null,
      sharedState: undefined,
      urlQuery: {},
      userId: 'user_1',
    },
    callEndpoint: jest.fn().mockResolvedValue({ success: true, response: null }),
    evaluateOperators: jest.fn((input) => input),
    getEndpointConfig: jest.fn(),
    ...overrides,
  };
}

function createAgent(overrides = {}) {
  return {
    agentId: 'test_agent',
    properties: { model: 'test-model', ...(overrides.properties ?? {}) },
    ...overrides,
  };
}

const connection = { provider: jest.fn((model) => ({ modelId: model })) };
const messages = [{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] }];

beforeEach(() => {
  jest.clearAllMocks();
  lastAgentConfig = null;
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockImplementation((schema) => schema);
  mockConvertToModelMessages.mockResolvedValue(['model-message']);
  mockPruneMessages.mockReturnValue(['pruned-message']);
  mockValidateUIMessages.mockResolvedValue(['validated-message']);
});

test('format text returns a text/plain Response streaming the agent text', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();

  const { response } = await handleAgentTextStream({
    connection,
    properties: { agent: createAgent(), messages },
    context: createTestContext({ format: 'text' }),
  });

  expect(response).toBeInstanceOf(Response);
  expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  expect(await response.text()).toBe('Hello world');
});

test('format stream returns an AsyncIterable of text chunks', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();

  const { response } = await handleAgentTextStream({
    connection,
    properties: { agent: createAgent(), messages },
    context: createTestContext({ format: 'stream' }),
  });

  const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  expect(chunks).toEqual(['Hello', ' world']);
});

test('validates and converts UI messages before streaming', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();

  const { response } = await handleAgentTextStream({
    connection,
    properties: { agent: createAgent(), messages },
    context: createTestContext({ format: 'stream' }),
  });
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of response) {
    // drain
  }

  expect(mockValidateUIMessages).toHaveBeenCalledWith({
    messages,
    tools: lastAgentConfig.tools,
  });
  expect(mockConvertToModelMessages).toHaveBeenCalledWith(['validated-message'], {
    tools: lastAgentConfig.tools,
  });
  expect(mockPruneMessages).not.toHaveBeenCalled();
  expect(mockStream.mock.calls[0][0].prompt).toEqual(['model-message']);
});

test('prune config prunes model messages before streaming', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();

  const { response } = await handleAgentTextStream({
    connection,
    properties: {
      agent: createAgent({ properties: { prune: { maxTokens: 100 } } }),
      messages,
    },
    context: createTestContext({ format: 'stream' }),
  });
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of response) {
    // drain
  }

  expect(mockPruneMessages).toHaveBeenCalledWith({
    messages: ['model-message'],
    maxTokens: 100,
  });
  expect(mockStream.mock.calls[0][0].prompt).toEqual(['pruned-message']);
});

test('onFinish hooks run with the finish payload after the stream drains', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();
  const context = createTestContext({ format: 'stream' });

  const { response } = await handleAgentTextStream({
    connection,
    properties: {
      agent: createAgent({ hooks: { onFinish: ['persist-conversation'] } }),
      messages,
    },
    context,
  });
  expect(context.callEndpoint).not.toHaveBeenCalled();
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of response) {
    // drain
  }

  expect(context.callEndpoint).toHaveBeenCalledTimes(1);
  const [endpointId, { payload }] = context.callEndpoint.mock.calls[0];
  expect(endpointId).toBe('persist-conversation');
  expect(payload).toMatchObject({
    messages: [{ role: 'assistant', content: 'Hello world' }],
    finishReason: 'stop',
    conversationId: 'conv_1',
    userId: 'user_1',
  });
  expect(payload.steps).toHaveLength(1);
});

test('MCP clients close after the stream drains', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();
  const mockClose = jest.fn().mockResolvedValue(undefined);
  mockCreateMCPClient.mockResolvedValue({
    tools: jest.fn().mockResolvedValue({}),
    close: mockClose,
  });

  const { response } = await handleAgentTextStream({
    connection,
    properties: {
      agent: createAgent({ mcp: [{ url: 'https://mcp.example.com', transport: 'http' }] }),
      messages,
    },
    context: createTestContext({ format: 'stream' }),
  });
  expect(mockClose).not.toHaveBeenCalled();
  // eslint-disable-next-line no-unused-vars
  for await (const chunk of response) {
    // drain
  }

  expect(mockClose).toHaveBeenCalledTimes(1);
});

test('confirm tools auto-execute - no approval channel exists', async () => {
  const { default: handleAgentTextStream } = await import('./handleAgentTextStream.js');
  mockStreamResult();
  const context = createTestContext({ format: 'stream' });
  context.getEndpointConfig = jest.fn().mockResolvedValue({
    description: 'Send an email',
    payloadSchema: { type: 'object' },
  });

  await handleAgentTextStream({
    connection,
    properties: {
      agent: createAgent({ tools: [{ id: 'send-email', confirm: true }] }),
      messages,
    },
    context,
  });

  // autoApprove strips needsApproval from confirm tools.
  expect(lastAgentConfig.tools['send-email']?.needsApproval).toBeUndefined();
});
