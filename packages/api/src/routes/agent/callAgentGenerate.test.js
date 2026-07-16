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

import callAgentGenerate from './callAgentGenerate.js';
import createAuthorize from '../../context/createAuthorize.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const agentConfig = {
  agentId: 'my-agent',
  id: 'agent:my-agent',
  auth: { public: true },
  type: 'ClaudeAgent',
  connectionId: 'my-anthropic',
  description: 'Test agent.',
  properties: { model: 'test-model' },
};
const connectionConfig = {
  connectionId: 'my-anthropic',
  id: 'connection:my-anthropic',
  type: 'Anthropic',
  properties: { apiKey: 'sk-test' },
};

function createContext({ user = { id: 'user_1' }, resolver } = {}) {
  const readConfigFile = jest.fn((path) => {
    if (path === 'agents/my-agent.json') return agentConfig;
    if (path === 'connections/my-anthropic.json') return connectionConfig;
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile,
    connections: {
      Anthropic: { create: jest.fn().mockReturnValue({ provider: 'mock-provider' }), requests: {} },
    },
    user,
  });
  context.agents = { ClaudeAgent: { resolver, schema: {} } };
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('callAgentGenerate runs the resolver in generate mode and returns the result', async () => {
  const mockResolver = jest.fn().mockResolvedValue({
    result: { text: 'Answer', finishReason: 'stop' },
  });
  const context = createContext({ resolver: mockResolver });

  const { result } = await callAgentGenerate(context, {
    agentId: 'my-agent',
    prompt: 'What is the answer?',
  });

  expect(result).toEqual({ text: 'Answer', finishReason: 'stop' });
  const call = mockResolver.mock.calls[0][0];
  expect(call.properties.prompt).toBe('What is the answer?');
  expect(call.context.mode).toBe('generate');
  expect(call.context.agentContext).toEqual({
    conversationId: null,
    pageId: null,
    sharedState: undefined,
    urlQuery: {},
    userId: 'user_1',
  });
});

test('callAgentGenerate authorizes the agent against the calling user', async () => {
  const mockResolver = jest.fn();
  const context = createContext({ user: null, resolver: mockResolver });
  context.authorize = createAuthorize({ user: null });
  context.readConfigFile = jest.fn((path) => {
    if (path === 'agents/my-agent.json') return { ...agentConfig, auth: { public: false } };
    return null;
  });

  await expect(
    callAgentGenerate(context, { agentId: 'my-agent', prompt: 'Hi' })
  ).rejects.toThrow('Authentication required for agent "my-agent".');
  expect(mockResolver).not.toHaveBeenCalled();
});
