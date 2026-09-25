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
import { UserError } from '@lowdefy/errors';

import prepareAgent from './prepareAgent.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const agentConfig = {
  agentId: 'my-agent',
  auth: { public: true },
  id: 'agent:my-agent',
  type: 'ClaudeAgent',
  connectionId: 'my-anthropic',
  tools: [],
  properties: { model: 'test-model' },
};
const connectionConfig = {
  connectionId: 'my-anthropic',
  id: 'connection:my-anthropic',
  type: 'Anthropic',
  properties: { apiKey: 'sk-test' },
};
const endpointConfig = {
  endpointId: 'my-endpoint',
  id: 'endpoint:my-endpoint',
  type: 'Api',
  auth: { public: true },
  routine: { ':return': { ok: true } },
};

const typedEndpointConfig = {
  endpointId: 'typed-endpoint',
  id: 'endpoint:typed-endpoint',
  type: 'Api',
  auth: { public: true },
  payloadSchema: {
    type: 'object',
    properties: { status: { enum: ['open', 'closed'] } },
  },
  routine: { ':return': { ok: true } },
};

function createContext({ mode } = {}) {
  const readConfigFile = jest.fn((path) => {
    if (path === 'agents/my-agent.json') return agentConfig;
    if (path === 'connections/my-anthropic.json') return connectionConfig;
    if (path === 'api/my-endpoint.json') return endpointConfig;
    if (path === 'api/typed-endpoint.json') return typedEndpointConfig;
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: jest.fn().mockReturnValue({ provider: 'mock-provider' }), requests: {} },
    },
    mode,
    user: { id: 'user_1' },
  });
  context.agents = { ClaudeAgent: { resolver: jest.fn(), schema: {} } };
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

const agentContext = {
  conversationId: null,
  pageId: null,
  sharedState: undefined,
  urlQuery: {},
  userId: 'user_1',
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('prepareAgent defaults resolver context mode to chat', async () => {
  const context = createContext();
  const { resolverContext } = await prepareAgent(context, { agentId: 'my-agent', agentContext });
  expect(resolverContext.mode).toBe('chat');
});

test('prepareAgent sets resolver context mode to generate', async () => {
  const context = createContext();
  const { resolverContext } = await prepareAgent(context, {
    agentId: 'my-agent',
    agentContext,
    mode: 'generate',
  });
  expect(resolverContext.mode).toBe('generate');
});

test('prepareAgent callEndpoint runs an endpoint and returns its response', async () => {
  const context = createContext();
  const { resolverContext } = await prepareAgent(context, {
    agentId: 'my-agent',
    agentContext,
    endpointDepth: 0,
  });
  const result = await resolverContext.callEndpoint('my-endpoint', { payload: {} });
  expect(result.success).toBe(true);
  expect(result.status).toBe('success');
});

test('prepareAgent callEndpoint enforces the endpoint depth cap', async () => {
  const context = createContext();
  const { resolverContext } = await prepareAgent(context, {
    agentId: 'my-agent',
    agentContext,
    endpointDepth: 10,
  });
  await expect(resolverContext.callEndpoint('my-endpoint', { payload: {} })).rejects.toThrow(
    'Endpoint call depth exceeded maximum of 10.'
  );
});

test('prepareAgent callEndpoint refuses a tool payload that violates the payloadSchema', async () => {
  const context = createContext();
  const { resolverContext } = await prepareAgent(context, {
    agentId: 'my-agent',
    agentContext,
    endpointDepth: 0,
  });
  await expect(
    resolverContext.callEndpoint('typed-endpoint', { payload: { status: 'pending' } })
  ).rejects.toThrow(UserError);
  await expect(
    resolverContext.callEndpoint('typed-endpoint', { payload: { status: 'pending' } })
  ).rejects.toThrow(
    'Payload for endpoint "typed-endpoint" does not match its payloadSchema at /status: must be equal to one of the allowed values (open, closed).'
  );
  const result = await resolverContext.callEndpoint('typed-endpoint', {
    payload: { status: 'open' },
  });
  expect(result.success).toBe(true);
});

// The agent stream's error text reaches the end user and AgentChat config, which see the
// same thing in dev and prod.
test.each(['dev', 'prod'])(
  'prepareAgent wireErrorMessage returns the generic message for a foreign error in %s',
  async (mode) => {
    const context = createContext({ mode });
    const { resolverContext } = await prepareAgent(context, { agentId: 'my-agent', agentContext });
    expect(resolverContext.wireErrorMessage(new Error('connect ECONNREFUSED 10.0.0.5:5432'))).toBe(
      'Something went wrong.'
    );
  }
);

test.each(['dev', 'prod'])(
  "prepareAgent wireErrorMessage returns the author's message for a UserError in %s",
  async (mode) => {
    const context = createContext({ mode });
    const { resolverContext } = await prepareAgent(context, { agentId: 'my-agent', agentContext });
    expect(resolverContext.wireErrorMessage(new UserError('Order is already closed.'))).toBe(
      'Order is already closed.'
    );
  }
);
