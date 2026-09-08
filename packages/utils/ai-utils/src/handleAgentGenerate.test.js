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
const mockGenerate = jest.fn();

let lastAgentConfig = null;

class MockToolLoopAgent {
  constructor(config) {
    this.config = config;
    this.tools = config.tools;
    lastAgentConfig = config;
  }
  generate = mockGenerate;
}

jest.unstable_mockModule('ai', () => ({
  ToolLoopAgent: MockToolLoopAgent,
  tool: mockTool,
  jsonSchema: mockJsonSchema,
  stepCountIs: mockStepCountIs,
  hasToolCall: mockHasToolCall,
  generateText: mockGenerateText,
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

const GENERATE_RESULT = {
  text: 'Final answer',
  finishReason: 'stop',
  steps: [
    {
      stepNumber: 0,
      text: '',
      toolCalls: [
        {
          toolCallId: 'call_1',
          toolName: 'lookup-data',
          input: { query: 'signups' },
          providerExecuted: false,
        },
      ],
      toolResults: [
        { toolCallId: 'call_1', toolName: 'lookup-data', output: { rows: 3 }, extra: 'dropped' },
      ],
      finishReason: 'tool-calls',
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    },
    {
      stepNumber: 1,
      text: 'Final answer',
      toolCalls: [],
      toolResults: [],
      finishReason: 'stop',
      usage: { inputTokens: 20, outputTokens: 8, totalTokens: 28 },
    },
  ],
  response: { messages: [{ role: 'assistant', content: 'Final answer' }] },
};

function mockGenerateSteps(result = GENERATE_RESULT) {
  mockGenerate.mockImplementation(async ({ onStepFinish }) => {
    if (onStepFinish) {
      for (const step of result.steps) {
        onStepFinish(step);
      }
    }
    return result;
  });
}

function createTestContext(overrides = {}) {
  return {
    mode: 'generate',
    agentContext: {
      conversationId: null,
      pageId: null,
      sharedState: undefined,
      urlQuery: {},
      userId: 'user_1',
    },
    callEndpoint: jest.fn().mockResolvedValue({ success: true, response: null }),
    evaluateOperators: jest.fn((input) => input),
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'Look up data',
      payloadSchema: { type: 'object' },
    }),
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

beforeEach(() => {
  jest.clearAllMocks();
  lastAgentConfig = null;
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockImplementation((schema) => schema);
});

test('handleAgentGenerate returns a serializable summary with accumulated usage', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  const { result } = await handleAgentGenerate({
    connection,
    properties: { agent: createAgent(), prompt: 'Summarize the signups.' },
    context: createTestContext(),
  });

  expect(mockGenerate).toHaveBeenCalledTimes(1);
  expect(mockGenerate.mock.calls[0][0].prompt).toBe('Summarize the signups.');
  expect(result).toEqual({
    text: 'Final answer',
    finishReason: 'stop',
    usage: {
      inputTokens: 30,
      outputTokens: 13,
      totalTokens: 43,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    toolCalls: [{ toolCallId: 'call_1', toolName: 'lookup-data', input: { query: 'signups' } }],
    toolResults: [{ toolCallId: 'call_1', toolName: 'lookup-data', output: { rows: 3 } }],
  });
});

test('handleAgentGenerate does not build the update-page-state tool when sharedState is undefined', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  await handleAgentGenerate({
    connection,
    properties: { agent: createAgent(), prompt: 'Go.' },
    context: createTestContext(),
  });

  expect(lastAgentConfig.tools['update-page-state']).toBeUndefined();
});

test('handleAgentGenerate builds confirm tools without needsApproval (autoApprove)', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ tools: [{ endpointId: 'lookup-data', confirm: true }] }),
      prompt: 'Go.',
    },
    context: createTestContext(),
  });

  expect(mockTool).toHaveBeenCalledTimes(1);
  expect(mockTool.mock.calls[0][0].needsApproval).toBeUndefined();
  expect(lastAgentConfig.tools['lookup-data']).toBeDefined();
});

test('handleAgentGenerate wires agent-level hook callbacks onto the ToolLoopAgent', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ hooks: { onStart: ['log-start'], onStepFinish: ['log-step'] } }),
      prompt: 'Go.',
    },
    context: createTestContext(),
  });

  expect(lastAgentConfig.experimental_onStart).toBeInstanceOf(Function);
  expect(lastAgentConfig.onStepFinish).toBeInstanceOf(Function);
});

test('handleAgentGenerate awaits onFinish hooks with the finish payload and ignores dataParts', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  const callEndpoint = jest.fn().mockResolvedValue({
    success: true,
    response: { dataParts: [{ type: 'data-custom', data: {} }] },
  });
  const context = createTestContext({ callEndpoint });

  const { result } = await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ hooks: { onFinish: ['save-run'] } }),
      prompt: 'Go.',
    },
    context,
  });

  expect(callEndpoint).toHaveBeenCalledTimes(1);
  const [endpointId, { payload }] = callEndpoint.mock.calls[0];
  expect(endpointId).toBe('save-run');
  expect(payload.messages).toEqual([{ role: 'assistant', content: 'Final answer' }]);
  expect(payload.finishReason).toBe('stop');
  expect(payload.isAborted).toBe(false);
  expect(payload.userId).toBe('user_1');
  expect(payload.usage.totalTokens).toBe(43);
  expect(payload.steps).toHaveLength(2);
  // dataParts from the hook response are ignored — no stream to write to.
  expect(result.text).toBe('Final answer');
});

test('handleAgentGenerate warns and continues when an onFinish hook fails', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const callEndpoint = jest.fn().mockRejectedValue(new Error('hook broke'));
  const { result } = await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ hooks: { onFinish: ['save-run'] } }),
      prompt: 'Go.',
    },
    context: createTestContext({ callEndpoint }),
  });

  expect(result.text).toBe('Final answer');
  expect(warnSpy).toHaveBeenCalledWith('onFinish hook "save-run" failed: hook broke');
  warnSpy.mockRestore();
});

test('handleAgentGenerate closes MCP clients when generate rejects', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  const close = jest.fn().mockResolvedValue();
  mockCreateMCPClient.mockResolvedValue({
    tools: jest.fn().mockResolvedValue({}),
    close,
  });
  mockGenerate.mockRejectedValue(new Error('model exploded'));

  await expect(
    handleAgentGenerate({
      connection,
      properties: {
        agent: createAgent({ mcp: [{ url: 'https://mcp.example.com' }] }),
        prompt: 'Go.',
      },
      context: createTestContext(),
    })
  ).rejects.toThrow('model exploded');

  expect(close).toHaveBeenCalledTimes(1);
});

test('handleAgentGenerate passes the agent timeout to generate', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ properties: { model: 'test-model', timeout: 60000 } }),
      prompt: 'Go.',
    },
    context: createTestContext(),
  });

  expect(mockGenerate.mock.calls[0][0].timeout).toBe(60000);
});

test('handleAgentGenerate never generates a conversation title', async () => {
  const { default: handleAgentGenerate } = await import('./handleAgentGenerate.js');
  mockGenerateSteps();

  await handleAgentGenerate({
    connection,
    properties: {
      agent: createAgent({ properties: { model: 'test-model', generateTitle: true } }),
      prompt: 'Go.',
    },
    context: createTestContext(),
  });

  expect(mockGenerateText).not.toHaveBeenCalled();
});
