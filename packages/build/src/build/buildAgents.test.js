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
      tools: [{ endpointId: 'tool1' }],
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
  expect(res.agents[0].tools).toEqual([{ endpointId: 'tool1' }, { endpointId: 'tool2' }]);
});

test('buildAgents throws when model is not defined', () => {
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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
  const context = testContext();
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

test('buildAgents with valid hook endpoint IDs passes', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
  expect(res.agents[0].tools).toEqual([{ endpointId: 'tool1' }]);
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
  expect(res.agents[0].tools).toEqual([{ endpointId: 'tool1', confirm: true }]);
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
    { endpointId: 'tool1' },
    { endpointId: 'tool2', confirm: true },
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
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
        agents: ['researcher'],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[1].agents).toEqual([{ agentId: 'researcher' }]);
});

test('buildAgents passes through object agents with agentId', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
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
        agents: [{ agentId: 'researcher', description: 'Research topics' }],
      },
    ],
  };
  const res = buildAgents({ components, context });
  expect(res.agents[1].agents).toEqual([
    { agentId: 'researcher', description: 'Research topics' },
  ]);
});

test('buildAgents normalizes mixed agents array', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    { agentId: 'researcher' },
    { agentId: 'analyzer', description: 'Analyze data' },
  ]);
});

test('buildAgents throws when agents references non-existent agent', () => {
  const context = testContext();
  const components = {
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
    connections: [
      { id: 'connection:conn1', connectionId: 'conn1', type: 'Anthropic' },
    ],
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
