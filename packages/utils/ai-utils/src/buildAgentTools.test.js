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
  expect(result).toEqual({ _subAgent: true, agentId: 'researcher', text: 'Sub-agent result' });
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
  const result = tools.researcher.toModelOutput({
    output: { _subAgent: true, agentId: 'researcher', text: 'Sub-agent findings here' },
  });
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

test('buildAgentTools throws ConfigError when endpoint tool name collides with reserved platform tool', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const agent = {
    tools: [{ endpointId: 'update-page-state' }],
  };
  const context = {
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'custom',
      payloadSchema: { type: 'object' },
    }),
    callEndpoint: jest.fn(),
  };

  await expect(buildAgentTools({ agent, context })).rejects.toThrow(
    /reserved platform tool name/i
  );
});

test('buildAgentTools throws ConfigError when sub-agent id collides with reserved name', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const agent = {
    agents: [{ agentId: 'read-file' }],
  };
  const context = {
    getAgentConfig: jest.fn(),
    getConnectionForAgent: jest.fn(),
    resolveMcpSources: jest.fn(),
  };

  await expect(buildAgentTools({ agent, context })).rejects.toThrow(
    /reserved platform tool name/i
  );
});

test('endpoint tool returns top-level marker-wrapped array as a plain array', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  // Build artifacts wrap location-marked arrays as { '~arr': [...], '~k': '...' }.
  // The serializer's skipMarkers mode must un-wrap this back into a plain array
  // before the array reaches the AI SDK as a tool result.
  const wrappedResponse = {
    '~arr': [
      { title: 'Annual leave', body: '25 days' },
      { title: 'Carry-over', body: 'Max 5 days' },
    ],
    '~k': 'api.search-policies.routine.0.:return',
  };

  const agent = {
    tools: [{ endpointId: 'search-policies' }],
    mcp: [],
  };
  const context = {
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'Search HR policies.',
      payloadSchema: { type: 'object' },
    }),
    callEndpoint: jest.fn().mockResolvedValue({ success: true, response: wrappedResponse }),
    evaluateOperators: jest.fn((x) => x),
  };

  const { tools } = await buildAgentTools({ agent, context });
  const result = await tools['search-policies'].execute(
    { query: 'leave' },
    { abortSignal: null }
  );

  expect(Array.isArray(result)).toBe(true);
  expect(result).toEqual([
    { title: 'Annual leave', body: '25 days' },
    { title: 'Carry-over', body: 'Max 5 days' },
  ]);
});

test('endpoint tool fallback error message translates per i18n.active locale', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const agent = {
    tools: [{ endpointId: 'broken' }],
    mcp: [],
  };
  const context = {
    i18n: {
      active: 'de-DE',
      defaultLocale: 'en-US',
      messages: {
        'de-DE': { 'agent.runtime.toolExecutionFailed': 'Endpunktausführung fehlgeschlagen' },
      },
    },
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'broken endpoint',
      payloadSchema: { type: 'object' },
    }),
    // success: false with no error message forces the translated fallback path
    callEndpoint: jest.fn().mockResolvedValue({ success: false, error: undefined }),
    evaluateOperators: jest.fn((x) => x),
  };

  const { tools } = await buildAgentTools({ agent, context });

  await expect(tools.broken.execute({}, { abortSignal: null })).rejects.toThrow(
    'Endpunktausführung fehlgeschlagen'
  );
});

test('buildAgentTools translates sub-agent depth error per i18n.active locale', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const context = {
    i18n: {
      active: 'de-DE',
      defaultLocale: 'en-US',
      messages: {
        'de-DE': {
          'agent.runtime.subAgentDepthExceeded':
            'Sub-Agent-Verschachtelung überschreitet maximale Tiefe von {max}.',
        },
      },
    },
  };

  await expect(buildAgentTools({ agent: {}, context, depth: 6 })).rejects.toThrow(
    'Sub-Agent-Verschachtelung überschreitet maximale Tiefe von 5.'
  );
});

test('buildAgentTools translates reserved-tool-name error per i18n.active locale', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  const agent = {
    tools: [{ endpointId: 'update-page-state' }],
  };
  const context = {
    i18n: {
      active: 'de-DE',
      defaultLocale: 'en-US',
      messages: {
        'de-DE': {
          'agent.runtime.reservedToolName':
            '{kind} "{name}" verwendet einen reservierten Plattform-Tool-Namen.',
        },
      },
    },
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'custom',
      payloadSchema: { type: 'object' },
    }),
    callEndpoint: jest.fn(),
  };

  await expect(buildAgentTools({ agent, context })).rejects.toThrow(
    'Endpoint tool "update-page-state" verwendet einen reservierten Plattform-Tool-Namen.'
  );
});

test('endpoint tool unwraps a marker-wrapped array nested under an object key', async () => {
  const { default: buildAgentTools } = await import('./buildAgentTools.js');

  // Same wrapper convention applies to nested arrays — e.g. payloadSchema's
  // `enum: [...]` or `required: [...]` would survive build with markers
  // attached. The same path cleans both tool results and payloadSchemas.
  const wrappedResponse = {
    items: {
      '~arr': ['phone', 'tablet', 'laptop'],
      '~k': 'api.search.routine.0.:return.items',
    },
    total: 3,
  };

  const agent = {
    tools: [{ endpointId: 'search' }],
    mcp: [],
  };
  const context = {
    getEndpointConfig: jest.fn().mockResolvedValue({
      description: 'Search products.',
      payloadSchema: { type: 'object' },
    }),
    callEndpoint: jest.fn().mockResolvedValue({ success: true, response: wrappedResponse }),
    evaluateOperators: jest.fn((x) => x),
  };

  const { tools } = await buildAgentTools({ agent, context });
  const result = await tools.search.execute({ q: 'phones' }, { abortSignal: null });

  expect(result).toEqual({ items: ['phone', 'tablet', 'laptop'], total: 3 });
  expect(Array.isArray(result.items)).toBe(true);
});
