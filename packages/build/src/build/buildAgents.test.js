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

import buildAgents from './buildAgents.js';
import testContext from '../test-utils/testContext.js';
import createCounter from '../utils/createCounter.js';

// testContext does not include typeCounters.agents — add it for these tests.
// This is a known gap: when buildAgents is integrated into the pipeline,
// typeCounters.agents must be added to createContext.js and testContext.js.
function createTestContext() {
  const context = testContext();
  context.typeCounters.agents = createCounter();
  return context;
}

test('buildAgents no agents', () => {
  const context = createTestContext();
  const components = {};
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(undefined);
});

test('buildAgents undefined agents', () => {
  const context = createTestContext();
  const components = { agents: undefined };
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(undefined);
});

test('buildAgents null agents', () => {
  const context = createTestContext();
  const components = { agents: null };
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(null);
});

test('buildAgents valid agent renames id and adds to agentIds', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        description: 'A tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1'],
        properties: {
          model: 'claude-sonnet-4-20250514',
        },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent:agent1',
      agentId: 'agent1',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      tools: ['tool1'],
      properties: {
        model: 'claude-sonnet-4-20250514',
      },
    },
  ]);
  expect(context.agentIds).toEqual(new Set(['agent1']));
});

test('buildAgents multiple valid agents', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'agent2',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent:agent1',
      agentId: 'agent1',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      properties: { model: 'test-model' },
    },
    {
      id: 'agent:agent2',
      agentId: 'agent2',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      properties: { model: 'test-model' },
    },
  ]);
  expect(context.agentIds).toEqual(new Set(['agent1', 'agent2']));
});

test('buildAgents agent with no tools works fine', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent:agent1',
      agentId: 'agent1',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      properties: { model: 'test-model' },
    },
  ]);
});

test('buildAgents throws on duplicate agentId', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow('Duplicate agentId "agent1".');
});

test('buildAgents throws when connectionId is not defined', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent connectionId is not defined at "agent1".'
  );
});

test('buildAgents throws when connectionId references non-existent connection', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'nonExistent',
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references connectionId "nonExistent" which does not exist.'
  );
});

test('buildAgents throws when connectionId references non-existent connection with no connections', () => {
  const context = createTestContext();
  const components = {
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references connectionId "conn1" which does not exist.'
  );
});

test('buildAgents throws when tool endpoint does not exist', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        description: 'A tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1', 'nonExistentTool'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references tool endpoint "nonExistentTool" which does not exist.'
  );
});

test('buildAgents matches connectionId against connection.connectionId (post-buildConnections)', () => {
  const context = createTestContext();
  // After buildConnections, connections have both id (prefixed) and connectionId (original)
  const components = {
    connections: [
      {
        id: 'connection:myConn',
        connectionId: 'myConn',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'myConn',
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].agentId).toBe('agent1');
});

test('buildAgents matches tool against endpoint.endpointId (post-buildApi)', () => {
  const context = createTestContext();
  // After buildApi, endpoints have both id (prefixed) and endpointId (original)
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    api: [
      {
        id: 'endpoint:myTool',
        endpointId: 'myTool',
        type: 'Api',
        description: 'A tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['myTool'],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].agentId).toBe('agent1');
});

test('buildAgents counts operators in properties', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: {
          model: { _env: 'AGENT_MODEL' },
          systemPrompt: {
            '_string.concat': ['Hello', 'World'],
          },
        },
      },
      {
        id: 'agent2',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: {
          apiKey: {
            _secret: 'API_KEY',
          },
          model: { _env: 'AGENT_MODEL' },
        },
      },
    ],
  };
  buildAgents({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _env: 2,
    _secret: 1,
    _string: 1,
  });
});

test('buildAgents tracks agent type usage', () => {
  const context = createTestContext();
  const components = {
    connections: [
      {
        id: 'connection:conn1',
        connectionId: 'conn1',
        type: 'Anthropic',
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        '~k': 'agents.0',
      },
      {
        id: 'agent2',
        type: 'OpenAIAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        '~k': 'agents.1',
      },
      {
        id: 'agent3',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        '~k': 'agents.2',
      },
    ],
  };
  buildAgents({ components, context });
  expect(context.typeCounters.agents.getCounts()).toEqual({
    AnthropicAgent: 2,
    OpenAIAgent: 1,
  });
});

test('buildAgents empty agents array initialises agentIds', () => {
  const context = createTestContext();
  const components = { connections: [], agents: [] };
  const res = buildAgents({ components, context });
  expect(res.agents).toEqual([]);
  expect(context.agentIds).toEqual(new Set());
});

test('buildAgents throws when tool endpoint not found and api is undefined', () => {
  const context = createTestContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [{
      id: 'agent1',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      tools: ['missing-tool'],
      properties: { model: 'test-model' },
    }],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references tool endpoint "missing-tool" which does not exist.'
  );
});

test('buildAgents validates multiple tools all referencing existing endpoints', () => {
  const context = createTestContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      { id: 'endpoint:tool1', endpointId: 'tool1', type: 'Api', description: 'Tool 1', payloadSchema: { type: 'object' }, routine: [] },
      { id: 'endpoint:tool2', endpointId: 'tool2', type: 'Api', description: 'Tool 2', payloadSchema: { type: 'object' }, routine: [] },
    ],
    agents: [{
      id: 'agent1',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      tools: ['tool1', 'tool2'],
      properties: { model: 'test-model' },
    }],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual(['tool1', 'tool2']);
});

test('buildAgents throws when model is not defined', () => {
  const context = createTestContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "model" is not defined at "agent1".'
  );
});

test('buildAgents throws when model is not defined with empty properties', () => {
  const context = createTestContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: {},
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "model" is not defined at "agent1".'
  );
});

test('buildAgents throws when tool endpoint is missing description', () => {
  const context = createTestContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Endpoint "tool1" is used as an agent tool but does not have a "description".'
  );
});

test('buildAgents throws when tool endpoint is missing payloadSchema', () => {
  const context = createTestContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        description: 'A tool',
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Endpoint "tool1" is used as an agent tool but does not have a "payloadSchema".'
  );
});
