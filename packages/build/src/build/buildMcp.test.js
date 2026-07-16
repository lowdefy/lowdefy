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

import buildMcp from './buildMcp.js';
import testContext from '../test-utils/testContext.js';

function contextWithAgents(agentIds = []) {
  const context = testContext();
  context.agentIds = new Set(agentIds);
  return context;
}

const endpoint = {
  id: 'endpoint:get-customer',
  endpointId: 'get-customer',
  type: 'Api',
  description: 'Look up a customer.',
  payloadSchema: { type: 'object' },
};

test('buildMcp writes unconfigured defaults when no mcp block is defined', () => {
  const context = contextWithAgents();
  const components = {};
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'lowdefy',
    version: '1.0.0',
    endpoints: [],
    agents: [],
    configured: false,
  });
});

test('buildMcp keeps explicit name and version and sets configured', () => {
  const context = contextWithAgents();
  const components = {
    api: [endpoint],
    mcp: { name: 'my-tools', version: '2.0.0', endpoints: ['get-customer'] },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp).toEqual({
    name: 'my-tools',
    version: '2.0.0',
    endpoints: ['get-customer'],
    agents: [],
    configured: true,
  });
});

test('buildMcp throws when an endpoint reference does not exist', () => {
  const context = contextWithAgents();
  const components = { mcp: { endpoints: ['missing'] } };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "missing" does not reference a defined api endpoint.'
  );
});

test('buildMcp throws when an endpoint is an InternalApi endpoint', () => {
  const context = contextWithAgents();
  const components = {
    api: [{ ...endpoint, type: 'InternalApi' }],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP endpoint "get-customer" is an InternalApi endpoint. Only "Api" endpoints can be exposed as MCP tools.'
  );
});

test('buildMcp throws when an endpoint has no description', () => {
  const context = contextWithAgents();
  const components = {
    api: [{ ...endpoint, description: undefined }],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Endpoint "get-customer" is exposed as an MCP tool but does not have a "description".'
  );
});

test('buildMcp throws when an endpoint has no payloadSchema', () => {
  const context = contextWithAgents();
  const components = {
    api: [{ ...endpoint, payloadSchema: undefined }],
    mcp: { endpoints: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Endpoint "get-customer" is exposed as an MCP tool but does not have a "payloadSchema".'
  );
});

test('buildMcp throws when an agent reference does not exist', () => {
  const context = contextWithAgents([]);
  const components = { mcp: { agents: ['missing-bot'] } };
  expect(() => buildMcp({ components, context })).toThrow(
    'MCP agent "missing-bot" does not reference a defined agent.'
  );
});

test('buildMcp throws when an agent has no description', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [{ agentId: 'support-bot', id: 'agent:support-bot', type: 'ClaudeAgent' }],
    mcp: { agents: ['support-bot'] },
  };
  expect(() => buildMcp({ components, context })).toThrow(
    'Agent "support-bot" is exposed as an MCP tool but does not have a "description".'
  );
});

test('buildMcp accepts endpoints and agents together', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    api: [endpoint],
    agents: [
      {
        agentId: 'support-bot',
        id: 'agent:support-bot',
        type: 'ClaudeAgent',
        description: 'Answers support questions.',
      },
    ],
    mcp: { endpoints: ['get-customer'], agents: ['support-bot'] },
  };
  const res = buildMcp({ components, context });
  expect(res.mcp.configured).toBe(true);
  expect(res.mcp.endpoints).toEqual(['get-customer']);
  expect(res.mcp.agents).toEqual(['support-bot']);
});

test('buildMcp throws on duplicate tool ids across endpoints and agents', () => {
  const context = contextWithAgents(['get-customer']);
  const components = {
    api: [endpoint],
    agents: [
      {
        agentId: 'get-customer',
        id: 'agent:get-customer',
        type: 'ClaudeAgent',
        description: 'An agent.',
      },
    ],
    mcp: { endpoints: ['get-customer'], agents: ['get-customer'] },
  };
  expect(() => buildMcp({ components, context })).toThrow('Duplicate MCP tool "get-customer".');
});
