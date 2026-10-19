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
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockResolver = jest.fn();
const mockCreate = jest.fn().mockReturnValue({ provider: 'mock-provider' });

function createAgentConfig(overrides = {}) {
  return {
    agentId: 'research_agent',
    auth: { public: true },
    id: 'agent:research_agent',
    type: 'TestAgent',
    connectionId: 'my_anthropic',
    tools: [],
    properties: { model: 'test-model' },
    ...overrides,
  };
}

function createMockReadConfigFile({ agentConfig, endpointConfigs = {} }) {
  return jest.fn((path) => {
    if (agentConfig && path === `agents/${agentConfig.agentId}.json`) {
      return agentConfig;
    }
    if (path === 'connections/my_anthropic.json') {
      return {
        id: 'connection:my_anthropic',
        connectionId: 'my_anthropic',
        type: 'Anthropic',
        properties: { apiKey: 'sk-test' },
      };
    }
    const match = path.match(/^api\/(.+)\.json$/);
    if (match && endpointConfigs[match[1]]) {
      const config = endpointConfigs[match[1]];
      if (!config.auth) {
        config.auth = { public: true };
      }
      return config;
    }
    return null;
  });
}

function createTestContext({ agentConfig, endpointConfigs, user } = {}) {
  const context = testContext({
    connections: { Anthropic: { create: mockCreate, requests: {} } },
    operators,
    logger,
    readConfigFile: createMockReadConfigFile({ agentConfig, endpointConfigs }),
    user: user === undefined ? { id: 'user_1', sub: 'user_1' } : user,
  });
  context.agents = { TestAgent: { resolver: mockResolver, schema: {} } };
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext(overrides = {}) {
  return {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
    ...overrides,
  };
}

const AGENT_RESULT = {
  text: 'Research complete.',
  finishReason: 'stop',
  usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  toolCalls: [],
  toolResults: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockReturnValue({ provider: 'mock-provider' });
});

test('CallAgent step runs the agent in generate mode and stores the result in steps', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Summarize the signups.' },
    },
  });

  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.steps.run_agent).toEqual(AGENT_RESULT);
  expect(mockResolver).toHaveBeenCalledTimes(1);
  const resolverArgs = mockResolver.mock.calls[0][0];
  expect(resolverArgs.connection).toEqual({ provider: 'mock-provider' });
  expect(resolverArgs.properties.prompt).toBe('Summarize the signups.');
  expect(resolverArgs.properties.agent.agentId).toBe('research_agent');
  expect(resolverArgs.context.mode).toBe('generate');
  expect(resolverArgs.context.agentContext).toEqual({
    conversationId: null,
    pageId: null,
    pathParams: {},
    sharedState: undefined,
    urlQuery: {},
    userId: 'user_1',
  });
});

test('CallAgent step resolves agentId and prompt with operators', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext({
    payload: { agent: 'research_agent', instruction: 'Do the thing.' },
  });

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: {
        agentId: { _payload: 'agent' },
        prompt: { _payload: 'instruction' },
      },
    },
  });

  expect(res).toEqual({ status: 'continue' });
  expect(mockResolver.mock.calls[0][0].properties.prompt).toBe('Do the thing.');
});

test('CallAgent step returns error status when the agent does not exist', async () => {
  const context = createTestContext({ agentConfig: undefined });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'missing_agent', prompt: 'Go.' },
    },
  });

  expect(res.status).toBe('error');
  expect(mockResolver).not.toHaveBeenCalled();
});

test('CallAgent step returns error status when the resolver throws', async () => {
  mockResolver.mockRejectedValue(new Error('Model exploded.'));
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Go.' },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toBe('Model exploded.');
});

test('CallAgent step returns error status when agentId does not evaluate to a string', async () => {
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext({ payload: { agent: { nested: true } } });

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: { _payload: 'agent' }, prompt: 'Go.' },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'CallAgent step "run_agent" properties.agentId must evaluate to a string.'
  );
});

test('CallAgent step returns error status when prompt does not evaluate to a string', async () => {
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: { _payload: 'missing' } },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain(
    'CallAgent step "run_agent" properties.prompt must evaluate to a string.'
  );
});

test('CallAgent step runs with userId null in system (scheduled) context', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({ agentConfig: createAgentConfig(), user: null });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Go.' },
    },
  });

  expect(res).toEqual({ status: 'continue' });
  expect(mockResolver.mock.calls[0][0].context.agentContext.userId).toBe(null);
});

test('CallAgent step threads endpointDepth so agent tool endpoint calls hit the depth cap', async () => {
  mockResolver.mockImplementation(async ({ context: resolverContext }) => {
    // Simulates the agent calling an endpoint tool at max depth.
    await resolverContext.callEndpoint('target_endpoint', { payload: {} });
    return { result: AGENT_RESULT };
  });
  const context = createTestContext({
    agentConfig: createAgentConfig(),
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: { ':return': { ok: true } },
      },
    },
  });
  const routineContext = createRoutineContext({ endpointDepth: 10 });

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Go.' },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.message).toContain('Endpoint call depth exceeded maximum of 10.');
});

test('CallAgent step evaluates agent properties operators against the headless agentContext', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({
    agentConfig: createAgentConfig({
      properties: { model: 'test-model', instructions: { _payload: 'userId' } },
    }),
  });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Go.' },
    },
  });

  expect(mockResolver.mock.calls[0][0].properties.agent.properties.instructions).toBe('user_1');
});

test('CallAgent step passes files resolved with operators to the resolver beside the prompt', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const files = [
    { url: 'https://files.example.com/one.png?sig=a', mediaType: 'image/png' },
    { url: 'https://files.example.com/two.png?sig=b', mediaType: 'image/png' },
  ];
  const routineContext = createRoutineContext({ payload: { files } });

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: {
        agentId: 'research_agent',
        prompt: 'Describe the screenshots.',
        files: { _payload: 'files' },
      },
    },
  });

  expect(res).toEqual({ status: 'continue' });
  expect(mockResolver.mock.calls[0][0].properties.prompt).toBe('Describe the screenshots.');
  expect(mockResolver.mock.calls[0][0].properties.files).toEqual(files);
  expect(routineContext.steps.run_agent).toEqual(AGENT_RESULT);
});

test('CallAgent step without files passes the prompt and an empty files list', async () => {
  mockResolver.mockResolvedValue({ result: AGENT_RESULT });
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext();

  await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: { agentId: 'research_agent', prompt: 'Go.', files: { _payload: 'missing' } },
    },
  });

  expect(mockResolver.mock.calls[0][0].properties.prompt).toBe('Go.');
  expect(mockResolver.mock.calls[0][0].properties.files).toEqual([]);
});

test('CallAgent step returns error status when files does not evaluate to an array', async () => {
  const context = createTestContext({ agentConfig: createAgentConfig() });
  const routineContext = createRoutineContext();

  const res = await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: {
        agentId: 'research_agent',
        prompt: 'Go.',
        files: { url: 'https://files.example.com/one.png?sig=secret', mediaType: 'image/png' },
      },
    },
  });

  expect(res.status).toBe('error');
  expect(res.error.name).toBe('ConfigError');
  expect(res.error.message).toContain(
    'CallAgent step "run_agent" properties.files must evaluate to an array. Received a value of type "object".'
  );
  expect(res.error.message).not.toContain('sig=secret');
  expect(mockResolver).not.toHaveBeenCalled();
});

test('CallAgent step returns error status when a file has no mediaType or no valid url', async () => {
  const context = createTestContext({ agentConfig: createAgentConfig() });

  const missingMediaType = await runRoutine(context, createRoutineContext(), {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: {
        agentId: 'research_agent',
        prompt: 'Go.',
        files: [{ url: 'https://files.example.com/one.png?sig=secret' }],
      },
    },
  });
  expect(missingMediaType.status).toBe('error');
  expect(missingMediaType.error.name).toBe('ConfigError');
  expect(missingMediaType.error.message).toContain(
    'CallAgent step "run_agent" properties.files[0] must have a url and a mediaType string. Received a url of type "string" and a mediaType of type "undefined".'
  );
  expect(missingMediaType.error.message).not.toContain('sig=secret');

  const badUrl = await runRoutine(context, createRoutineContext(), {
    routine: {
      id: 'agent:test_endpoint:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'test_endpoint',
      properties: {
        agentId: 'research_agent',
        prompt: 'Go.',
        files: [{ url: 'not a url', mediaType: 'image/png' }],
      },
    },
  });
  expect(badUrl.status).toBe('error');
  expect(badUrl.error.message).toContain('properties.files[0] must have a url');
  expect(mockResolver).not.toHaveBeenCalled();
});
