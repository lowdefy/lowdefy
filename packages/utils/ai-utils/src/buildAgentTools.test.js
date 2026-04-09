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

let lastAgentConfig = null;
const mockGenerate = jest.fn().mockResolvedValue({ text: 'Sub-agent result' });

class MockToolLoopAgent {
  constructor(config) {
    this.config = config;
    lastAgentConfig = config;
  }
  generate(opts) {
    return mockGenerate(opts);
  }
}

jest.unstable_mockModule('ai', () => ({
  ToolLoopAgent: MockToolLoopAgent,
  tool: mockTool,
  jsonSchema: mockJsonSchema,
  stepCountIs: jest.fn((n) => ({ type: 'stepCount', count: n })),
  hasToolCall: jest.fn((name) => ({ type: 'hasToolCall', toolName: name })),
}));

const mockCreateMCPClient = jest.fn();
jest.unstable_mockModule('@ai-sdk/mcp', () => ({
  createMCPClient: mockCreateMCPClient,
}));

jest.unstable_mockModule('@ai-sdk/mcp/mcp-stdio', () => ({
  Experimental_StdioMCPTransport: class MockStdio {
    constructor(config) {
      this.config = config;
    }
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  lastAgentConfig = null;
  mockTool.mockImplementation((def) => def);
  mockJsonSchema.mockImplementation((schema) => schema);
});

test('buildAgentTools creates sub-agent tools from agent.agents references', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'researcher',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    properties: {
      model: 'claude-haiku-4-5-20251001',
      instructions: 'You research topics.',
      maxSteps: 10,
    },
  };

  const mockSubConnection = { provider: jest.fn().mockReturnValue('sub-model') };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'researcher' }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue(mockSubConnection),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  const { tools } = await buildAgentTools({ agent, context });

  expect(context.getAgentConfig).toHaveBeenCalledWith({ agentId: 'researcher' });
  expect(context.getConnectionForAgent).toHaveBeenCalledWith({ agentConfig: subAgentConfig });
  expect(tools.researcher).toBeDefined();
  expect(tools.researcher.description).toBe('Delegate task to the researcher agent');
});

test('buildAgentTools sub-agent tool uses custom description when provided', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'researcher',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    properties: { model: 'test', maxSteps: 5 },
  };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'researcher', description: 'Research topics thoroughly' }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue({ provider: jest.fn().mockReturnValue({}) }),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  const { tools } = await buildAgentTools({ agent, context });

  expect(tools.researcher.description).toBe('Research topics thoroughly');
});

test('buildAgentTools sub-agent tool execute calls generate and returns text', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'researcher',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    properties: { model: 'test', maxSteps: 5 },
  };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'researcher' }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue({ provider: jest.fn().mockReturnValue({}) }),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  const { tools } = await buildAgentTools({ agent, context });

  // Execute the sub-agent tool
  const result = await tools.researcher.execute({ task: 'Research AI' }, { abortSignal: null });
  expect(mockGenerate).toHaveBeenCalledWith({ prompt: 'Research AI', abortSignal: null });
  expect(result).toBe('Sub-agent result');
});

test('buildAgentTools sub-agent tool uses custom inputSchema', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'analyzer',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    properties: { model: 'test', maxSteps: 5 },
  };

  const customSchema = {
    type: 'object',
    properties: {
      dataset: { type: 'string' },
      metrics: { type: 'array', items: { type: 'string' } },
    },
    required: ['dataset'],
  };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'analyzer', inputSchema: customSchema }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue({ provider: jest.fn().mockReturnValue({}) }),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  const { tools } = await buildAgentTools({ agent, context });

  expect(mockJsonSchema).toHaveBeenCalledWith(customSchema);
});

test('buildAgentTools throws when sub-agent nesting exceeds max depth', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'deep-agent',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    agents: [{ agentId: 'deep-agent' }],
    properties: { model: 'test', maxSteps: 5 },
  };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'deep-agent' }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue({ provider: jest.fn().mockReturnValue({}) }),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  await expect(buildAgentTools({ agent, context, depth: 5 })).rejects.toThrow(
    'Sub-agent nesting exceeds maximum depth of 5.'
  );
});

test('buildAgentTools sub-agent tool has toModelOutput that returns text type', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const subAgentConfig = {
    agentId: 'researcher',
    connectionId: 'anthropic',
    tools: [],
    mcp: [],
    properties: { model: 'test', maxSteps: 5 },
  };

  const agent = {
    tools: [],
    mcp: [],
    agents: [{ agentId: 'researcher' }],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
    getAgentConfig: jest.fn().mockResolvedValue(subAgentConfig),
    getConnectionForAgent: jest.fn().mockResolvedValue({ provider: jest.fn().mockReturnValue({}) }),
    resolveMcpSources: jest.fn().mockResolvedValue([]),
  };

  const { tools } = await buildAgentTools({ agent, context });

  expect(tools.researcher.toModelOutput).toBeDefined();
  const result = tools.researcher.toModelOutput({ output: 'Sub-agent findings here' });
  expect(result).toEqual({ type: 'text', value: 'Sub-agent findings here' });
});

test('buildAgentTools with no agents property returns only endpoint tools', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const agent = {
    tools: [],
    mcp: [],
  };

  const context = {
    getEndpointConfig: jest.fn(),
    callEndpoint: jest.fn(),
    evaluateOperators: jest.fn((x) => x),
  };

  const { tools } = await buildAgentTools({ agent, context });

  expect(Object.keys(tools)).toEqual([]);
});
