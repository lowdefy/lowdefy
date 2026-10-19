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

test('buildAgents no agents', () => {
  const context = testContext();
  const components = {};
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(undefined);
});

test('buildAgents undefined agents', () => {
  const context = testContext();
  const components = { agents: undefined };
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(undefined);
});

test('buildAgents null agents', () => {
  const context = testContext();
  const components = { agents: null };
  const res = buildAgents({ components, context });
  expect(res.agents).toBe(null);
});

test('buildAgents throws a ConfigError when agents is defined and not an array', () => {
  const context = testContext();
  const components = { agents: { not: 'an-array' } };
  expect(() => buildAgents({ components, context })).toThrow('Agents is not an array.');
});

test('buildAgents is a no-op when agents is not defined', () => {
  const context = testContext();
  const components = {};
  const res = buildAgents({ components, context });
  expect(res.agents).toBeUndefined();
  expect(context.agentIds).toEqual(new Set());
});

test('buildAgents valid agent renames id and adds to agentIds', () => {
  const context = testContext();
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
      tools: [{ endpointId: 'tool1', name: 'tool1' }],
      mcp: [],
      agents: [],
      properties: {
        model: 'claude-sonnet-4-20250514',
      },
    },
  ]);
  expect(context.agentIds).toEqual(new Set(['agent1']));
});

test('buildAgents multiple valid agents', () => {
  const context = testContext();
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
      tools: [],
      mcp: [],
      agents: [],
      properties: { model: 'test-model' },
    },
    {
      id: 'agent:agent2',
      agentId: 'agent2',
      type: 'AnthropicAgent',
      connectionId: 'conn1',
      tools: [],
      mcp: [],
      agents: [],
      properties: { model: 'test-model' },
    },
  ]);
  expect(context.agentIds).toEqual(new Set(['agent1', 'agent2']));
});

test('buildAgents agent with no tools works fine', () => {
  const context = testContext();
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
      tools: [],
      mcp: [],
      agents: [],
      properties: { model: 'test-model' },
    },
  ]);
});

test('buildAgents throws on duplicate agentId', () => {
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
  const components = { connections: [], agents: [] };
  const res = buildAgents({ components, context });
  expect(res.agents).toEqual([]);
  expect(context.agentIds).toEqual(new Set());
});

test('buildAgents throws when tool endpoint not found and api is undefined', () => {
  const context = testContext();
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
        tools: ['missing-tool'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references tool endpoint "missing-tool" which does not exist.'
  );
});

test('buildAgents validates multiple tools all referencing existing endpoints', () => {
  const context = testContext();
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
        description: 'Tool 1',
        payloadSchema: { type: 'object' },
        routine: [],
      },
      {
        id: 'endpoint:tool2',
        endpointId: 'tool2',
        type: 'Api',
        description: 'Tool 2',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1', 'tool2'],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([
    { endpointId: 'tool1', name: 'tool1' },
    { endpointId: 'tool2', name: 'tool2' },
  ]);
});

test('buildAgents throws when model is not defined', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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

test('buildAgents with valid hook endpoint IDs passes', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:save-data',
        endpointId: 'save-data',
        type: 'Api',
        description: 'Save data',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        hooks: {
          onToolCallFinish: ['save-data'],
        },
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents throws when hook references non-existent endpoint', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agent1',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        hooks: {
          onFinish: ['non-existent'],
        },
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" hook "onFinish" references endpoint "non-existent" which does not exist.'
  );
});

test('buildAgents with no hooks passes', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agent1',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents with empty hooks arrays passes', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agent1',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        hooks: {
          onStart: [],
          onFinish: [],
        },
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents normalizes string tools to objects', () => {
  const context = testContext();
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
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([{ endpointId: 'tool1', name: 'tool1' }]);
});

test('buildAgents passes through object tools with confirm', () => {
  const context = testContext();
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
        tools: [{ endpointId: 'tool1', confirm: true }],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([{ endpointId: 'tool1', name: 'tool1', confirm: true }]);
});

test('buildAgents normalizes mixed tool array', () => {
  const context = testContext();
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
        description: 'Tool 1',
        payloadSchema: { type: 'object' },
        routine: [],
      },
      {
        id: 'endpoint:tool2',
        endpointId: 'tool2',
        type: 'Api',
        description: 'Tool 2',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['tool1', { endpointId: 'tool2', confirm: true }],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([
    { endpointId: 'tool1', name: 'tool1' },
    { endpointId: 'tool2', name: 'tool2', confirm: true },
  ]);
});

test('buildAgents throws when object tool references non-existent endpoint', () => {
  const context = testContext();
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
        tools: [{ endpointId: 'nonexistent', confirm: true }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" references tool endpoint "nonexistent" which does not exist.'
  );
});

test('buildAgents valid mcp sources pass validation', () => {
  const context = testContext();
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
        mcp: [{ url: 'https://mcp.example.com' }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents throws when mcp source is missing url', () => {
  const context = testContext();
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
        mcp: [{ transport: 'sse' }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" "mcp" source at index 0 is missing "url".'
  );
});

test('buildAgents valid stdio mcp source passes validation', () => {
  const context = testContext();
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
        mcp: [{ transport: 'stdio', command: 'npx', args: ['-y', 'some-mcp-server'] }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents throws when stdio mcp source is missing command', () => {
  const context = testContext();
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
        mcp: [{ transport: 'stdio' }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" "mcp" source at index 0 uses stdio transport but is missing "command".'
  );
});

test('buildAgents normalizes mcp string to connectionId object', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
      { id: 'connection:my_mcp', connectionId: 'my_mcp', type: 'Mcp' },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        mcp: ['my_mcp'],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].mcp).toEqual([{ connectionId: 'my_mcp' }]);
});

test('buildAgents passes through mcp object with connectionId', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
      { id: 'connection:my_mcp', connectionId: 'my_mcp', type: 'Mcp' },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        mcp: [{ connectionId: 'my_mcp', confirm: true }],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].mcp).toEqual([{ connectionId: 'my_mcp', confirm: true }]);
});

test('buildAgents throws when mcp connectionId does not exist', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        mcp: ['nonexistent'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" "mcp" source at index 0 references connection "nonexistent" which does not exist.'
  );
});

test('buildAgents allows mixed mcp inline and connectionId', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
      { id: 'connection:my_mcp', connectionId: 'my_mcp', type: 'Mcp' },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        mcp: ['my_mcp', { url: 'https://example.com/mcp' }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
  const res = buildAgents({ components, context });
  expect(res.agents[0].mcp).toEqual([
    { connectionId: 'my_mcp' },
    { url: 'https://example.com/mcp' },
  ]);
});

test('buildAgents with no mcp array works fine', () => {
  const context = testContext();
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
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents normalizes string agents to objects with agentId', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'researcher',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['researcher'],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[1].agents).toEqual([{ agentId: 'researcher', name: 'researcher' }]);
});

test('buildAgents passes through object agents with agentId', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'researcher',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: [{ agentId: 'researcher', description: 'Research topics' }],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[1].agents).toEqual([
    { agentId: 'researcher', name: 'researcher', description: 'Research topics' },
  ]);
});

test('buildAgents normalizes mixed agents array', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'researcher',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'analyzer',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['researcher', { agentId: 'analyzer', description: 'Analyze data' }],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[2].agents).toEqual([
    { agentId: 'researcher', name: 'researcher' },
    { agentId: 'analyzer', name: 'analyzer', description: 'Analyze data' },
  ]);
});

test('buildAgents throws when agents references non-existent agent', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['nonexistent'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "orchestrator" references sub-agent "nonexistent" which does not exist.'
  );
});

test('buildAgents throws when agents object references non-existent agent', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: [{ agentId: 'nonexistent' }],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "orchestrator" references sub-agent "nonexistent" which does not exist.'
  );
});

test('buildAgents with no agents property works fine', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agent1',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].agents).toEqual([]);
});

test('buildAgents throws when sub-agent tool name collides with endpoint tool', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:researcher',
        endpointId: 'researcher',
        type: 'Api',
        description: 'A tool named researcher',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'researcher',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        tools: ['researcher'],
        agents: ['researcher'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "orchestrator" sub-agent "researcher" conflicts with an endpoint tool of the same name.'
  );
});

test('buildAgents throws on direct circular reference (A -> B -> A)', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agentA',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentB'],
      },
      {
        id: 'agentB',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentA'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Circular sub-agent reference detected involving "agentA".'
  );
});

test('buildAgents throws on self-referencing agent', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agentA',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentA'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Circular sub-agent reference detected involving "agentA".'
  );
});

test('buildAgents throws on transitive circular reference (A -> B -> C -> A)', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'agentA',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentB'],
      },
      {
        id: 'agentB',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentC'],
      },
      {
        id: 'agentC',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['agentA'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(/Circular sub-agent reference/);
});

test('buildAgents allows valid non-circular sub-agent chains', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'worker',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'supervisor',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['worker'],
      },
      {
        id: 'director',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['supervisor'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents allows diamond-shaped sub-agent graphs (not a cycle)', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'worker',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'teamA',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['worker'],
      },
      {
        id: 'teamB',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['worker'],
      },
      {
        id: 'director',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['teamA', 'teamB'],
      },
    ],
  };
  expect(() => buildAgents({ components, context })).not.toThrow();
});

test('buildAgents warns when sub-agent has tools with confirm: true', () => {
  const warnings = [];
  const context = testContext({
    logger: { warn: (msg) => warnings.push(msg) },
  });
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:dangerous-tool',
        endpointId: 'dangerous-tool',
        type: 'Api',
        description: 'A dangerous tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'worker',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        tools: [{ endpointId: 'dangerous-tool', confirm: true }],
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['worker'],
      },
    ],
  };
  buildAgents({ components, context });
  expect(warnings.some((w) => w.includes('confirm'))).toBe(true);
  expect(warnings.some((w) => w.includes('worker'))).toBe(true);
});

test('buildAgents does not warn when sub-agent has no confirm tools', () => {
  const warnings = [];
  const context = testContext({
    logger: { warn: (msg) => warnings.push(msg) },
  });
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:safe-tool',
        endpointId: 'safe-tool',
        type: 'Api',
        description: 'A safe tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'worker',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        tools: [{ endpointId: 'safe-tool' }],
      },
      {
        id: 'orchestrator',
        type: 'ClaudeAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
        agents: ['worker'],
      },
    ],
  };
  buildAgents({ components, context });
  expect(warnings.some((w) => w.includes('confirm'))).toBe(false);
});

test('buildAgents throws when fileSystem.basePath is not a string', () => {
  const context = testContext();
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
          model: 'test-model',
          fileSystem: { basePath: 123 },
        },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" fileSystem.basePath is not a string.'
  );
});

test('buildAgents throws when fileSystem.basePath does not exist', () => {
  const context = testContext();
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
          model: 'test-model',
          fileSystem: { basePath: '__nonexistent_ldf_test_dir__' },
        },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" fileSystem.basePath "__nonexistent_ldf_test_dir__" does not exist.'
  );
});

test('buildAgents throws when tool endpointId uses a reserved platform tool name', () => {
  const context = testContext();
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
        id: 'endpoint:update-page-state',
        endpointId: 'update-page-state',
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
        tools: ['update-page-state'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    /tool "update-page-state" uses a reserved platform tool name/
  );
});

test('buildAgents throws when sub-agent agentId uses a reserved platform tool name', () => {
  const context = testContext();
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
        id: 'read-file',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'parent',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        agents: ['read-file'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    /sub-agent "read-file" uses a reserved platform tool name/
  );
});

test('buildAgents defaults tool name from module-scoped endpoint id', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:reporting/query-data',
        endpointId: 'reporting/query-data',
        type: 'Api',
        description: 'Query data',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'reporting/assistant',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['reporting/query-data'],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([
    { endpointId: 'reporting/query-data', name: 'reporting__query-data' },
  ]);
  expect(context.agentIds).toEqual(new Set(['reporting/assistant']));
});

test('buildAgents keeps explicit tool name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:reporting/query-data',
        endpointId: 'reporting/query-data',
        type: 'Api',
        description: 'Query data',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: [{ endpointId: 'reporting/query-data', name: 'query_data' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[0].tools).toEqual([{ endpointId: 'reporting/query-data', name: 'query_data' }]);
});

test('buildAgents throws on invalid explicit tool name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
        tools: [{ endpointId: 'tool1', name: 'has space' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(/tool name "has space" is invalid/);
});

test('buildAgents throws when explicit tool name is reserved', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
        tools: [{ endpointId: 'tool1', name: 'update-page-state' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    /tool "update-page-state" uses a reserved platform tool name/
  );
});

test('buildAgents throws on duplicate tool names', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:tool1',
        endpointId: 'tool1',
        type: 'Api',
        description: 'Tool 1',
        payloadSchema: { type: 'object' },
        routine: [],
      },
      {
        id: 'endpoint:tool2',
        endpointId: 'tool2',
        type: 'Api',
        description: 'Tool 2',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: [
          { endpointId: 'tool1', name: 'the_tool' },
          { endpointId: 'tool2', name: 'the_tool' },
        ],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(/duplicate tool name "the_tool"/);
});

test('buildAgents defaults sub-agent tool name from scoped agent id', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'reporting/researcher',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'reporting/orchestrator',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        agents: ['reporting/researcher'],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[1].agents).toEqual([
    { agentId: 'reporting/researcher', name: 'reporting__researcher' },
  ]);
});

test('buildAgents throws when sub-agent name collides with a tool name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:helper',
        endpointId: 'helper',
        type: 'Api',
        description: 'A tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'helper-agent',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'parent',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['helper'],
        agents: [{ agentId: 'helper-agent', name: 'helper' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    /sub-agent "helper-agent" conflicts with an endpoint tool of the same name/
  );
});

test('buildAgents throws a located error when an agent id is a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: '__proto__',
        '~k': 'agentKey',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent id "__proto__" is a reserved name and cannot be used as an id.'
  );
  try {
    buildAgents({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('agentKey');
  }
});

test('buildAgents throws a located error when an endpoint tool name is a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
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
        '~k': 'agentKey',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: [{ endpointId: 'tool1', name: '__proto__' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" tool name "__proto__" is a reserved name and cannot be used as a tool name.'
  );
  try {
    buildAgents({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('agentKey');
  }
});

test('buildAgents throws a located error when a sub-agent tool name is a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'helper',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'parent',
        '~k': 'parentKey',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        agents: [{ agentId: 'helper', name: 'constructor' }],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "parent" sub-agent tool name "constructor" is a reserved name and cannot be used as a tool name.'
  );
  try {
    buildAgents({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('parentKey');
  }
});

test('buildAgents accepts a sub-agent whose derived tool name is not a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: 'a/__proto__',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'parent',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        agents: ['a/__proto__'],
        properties: { model: 'test-model' },
      },
    ],
  };
  const res = buildAgents({ components, context });
  // '/' becomes '__', so the derived name is 'a____proto__', not '__proto__'.
  expect(res.agents[1].agents).toEqual([{ agentId: 'a/__proto__', name: 'a____proto__' }]);
});

// The reserved check has to run on the derived name, not the raw id: '/' becomes
// '__', so a legal endpoint or agent id can manufacture a reserved tool name.
test('buildAgents throws when an endpoint tool name derived from a legal id is a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    api: [
      {
        id: 'endpoint:/proto__',
        endpointId: '/proto__',
        type: 'Api',
        description: 'A tool',
        payloadSchema: { type: 'object' },
        routine: [],
      },
    ],
    agents: [
      {
        id: 'agent1',
        '~k': 'agentKey',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        tools: ['/proto__'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "agent1" tool name "__proto__" is a reserved name and cannot be used as a tool name.'
  );
});

test('buildAgents throws when a sub-agent tool name derived from a legal agent id is a reserved name', () => {
  const context = testContext();
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' }],
    agents: [
      {
        id: '__proto/',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        properties: { model: 'test-model' },
      },
      {
        id: 'parent',
        '~k': 'parentKey',
        type: 'AnthropicAgent',
        connectionId: 'conn1',
        agents: ['__proto/'],
        properties: { model: 'test-model' },
      },
    ],
  };
  expect(() => buildAgents({ components, context })).toThrow(
    'Agent "parent" sub-agent tool name "__proto__" is a reserved name and cannot be used as a tool name.'
  );
  try {
    buildAgents({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('parentKey');
  }
});

test('buildAgents collects an error per invalid agent and still builds the valid ones', () => {
  const context = testContext();
  context.errors = [];
  const components = {
    connections: [{ id: 'connection:conn1', connectionId: 'conn1' }],
    agents: [
      { id: 'no_connection', type: 'AiAgent', properties: { model: 'm' }, '~k': 'k1' },
      {
        id: 'no_model',
        type: 'AiAgent',
        connectionId: 'conn1',
        '~k': 'k2',
      },
      {
        id: 'good',
        type: 'AiAgent',
        connectionId: 'conn1',
        properties: { model: 'm' },
        '~k': 'k3',
      },
    ],
  };
  buildAgents({ components, context });
  expect(context.errors.length).toBe(2);
  expect(context.errors[0].message).toBe('Agent connectionId is not defined at "no_connection".');
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.errors[1].message).toBe('Agent "model" is not defined at "no_model".');
  expect(context.errors[1].configKey).toBe('k2');
  expect(context.agentIds).toEqual(new Set(['good']));
  expect(components.agents[2].id).toBe('agent:good');
});

test('buildAgents collects a missing agent id error', () => {
  const context = testContext();
  context.errors = [];
  const components = { agents: [{ type: 'AiAgent', '~k': 'k1' }] };
  buildAgents({ components, context });
  expect(context.errors.length).toBe(1);
  expect(context.errors[0].message).toBe('Agent id missing.');
});

test('buildAgents collects an error when agent id is not a string', () => {
  const context = testContext();
  context.errors = [];
  const components = { agents: [{ id: 7, type: 'AiAgent', '~k': 'k1' }] };
  buildAgents({ components, context });
  expect(context.errors.length).toBe(1);
  expect(context.errors[0].message).toBe('Agent id is not a string.');
  expect(context.errors[0].received).toBe(7);
});

test('buildAgents marks a nonexistent connection reference with the connection-refs check slug', () => {
  const context = testContext();
  context.errors = [];
  const components = {
    agents: [
      {
        id: 'a1',
        type: 'AiAgent',
        connectionId: 'missing',
        properties: { model: 'm' },
        '~k': 'k1',
      },
    ],
  };
  buildAgents({ components, context });
  expect(context.errors.length).toBe(1);
  expect(context.errors[0].checkSlug).toBe('connection-refs');
});
