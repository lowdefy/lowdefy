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
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { operatorsServer } from '@lowdefy/operators-js';

import callAgent from './callAgent.js';
import callEndpoint from '../endpoints/callEndpoint.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createMcpServer from '../mcp/createMcpServer.js';
import runDetachedEndpoint from '../endpoints/runDetachedEndpoint.js';
import runRoutine from '../endpoints/runRoutine.js';
import runScheduledEndpoint from '../endpoints/runScheduledEndpoint.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// What each endpoint below returns: the calling agent as the endpoint sees it.
const whoamiReturn = {
  id: { _agent: 'id' },
  conversationId: { _agent: 'conversationId' },
  files: { _agent: 'files' },
  all: { _agent: true },
};

const noAgent = { id: null, conversationId: null, files: null, all: null };

// A spoofing payload: fields a model could put in a tool call's input.
const spoofPayload = {
  agentId: 'intruder_agent',
  agent: { id: 'intruder_agent', conversationId: 'conv_intruder' },
};

const callInnerResolver = jest.fn(({ callApi }) => callApi({ endpointId: 'whoami' }));
callInnerResolver.schema = {};
callInnerResolver.meta = { checkRead: false, checkWrite: false };

const endpointConfigs = {
  whoami: {
    endpointId: 'whoami',
    type: 'Api',
    description: 'Who is calling.',
    payloadSchema: { type: 'object' },
    routine: { ':return': whoamiReturn },
  },
  nested_call_api: {
    endpointId: 'nested_call_api',
    type: 'Api',
    routine: [
      {
        id: 'endpoint:nested_call_api:call_inner',
        stepId: 'call_inner',
        type: 'CallApi',
        properties: { endpointId: 'whoami', payload: spoofPayload },
      },
      { ':return': { _step: 'call_inner' } },
    ],
  },
  nested_request_call_api: {
    endpointId: 'nested_request_call_api',
    type: 'Api',
    routine: [
      {
        id: 'request:nested_request_call_api:call_inner',
        stepId: 'call_inner',
        type: 'CallInner',
        connectionId: 'test',
        properties: {},
      },
      { ':return': { _step: 'call_inner' } },
    ],
  },
  nested_in_control: {
    endpointId: 'nested_in_control',
    type: 'Api',
    routine: [
      {
        ':try': [
          {
            id: 'endpoint:nested_in_control:call_inner',
            stepId: 'call_inner',
            type: 'CallApi',
            properties: { endpointId: 'whoami' },
          },
        ],
        ':catch': [],
      },
      { ':return': { _step: 'call_inner' } },
    ],
  },
  detached_dispatch: {
    endpointId: 'detached_dispatch',
    type: 'Api',
    routine: [
      {
        id: 'endpoint:detached_dispatch:spawn',
        stepId: 'spawn',
        type: 'CallApi',
        properties: { endpointId: 'whoami', detached: true },
      },
      { ':return': { spawned: true } },
    ],
  },
  scheduled_whoami: {
    endpointId: 'scheduled_whoami',
    type: 'Api',
    schedules: [{ cron: '0 6 * * *' }],
    routine: { ':return': whoamiReturn },
  },
};

const agentConfig = {
  agentId: 'support_agent',
  auth: { public: true },
  id: 'agent:support_agent',
  type: 'TestAgent',
  connectionId: 'my_anthropic',
  tools: [],
  properties: { model: 'test-model' },
};

// Stands in for the agent plugin: runs one tool call, the endpoint and input the test sets, the
// way buildAgentTools' execute calls resolverContext.callEndpoint.
let toolCall = { endpointId: 'whoami', input: {} };
const agentResolver = jest.fn(async ({ context: resolverContext }) => {
  const result = await resolverContext.callEndpoint(toolCall.endpointId, {
    payload: toolCall.input,
  });
  return { response: result, result };
});

function createContext({ user = { id: 'user_1', sub: 'user_1' } } = {}) {
  const files = {
    'agents/support_agent.json': agentConfig,
    'connections/my_anthropic.json': {
      id: 'connection:my_anthropic',
      connectionId: 'my_anthropic',
      type: 'Anthropic',
      properties: { apiKey: 'sk-test' },
    },
    'connections/test.json': {
      id: 'connection:test',
      connectionId: 'test',
      type: 'TestConnection',
      properties: {},
    },
    'mcp.json': {
      name: 'test-tools',
      version: '1.0.0',
      configured: true,
      hasPublicTool: true,
      endpoints: [{ id: 'whoami', scope: 'mcp:read' }],
    },
  };
  const readConfigFile = jest.fn((path) => {
    if (files[path]) return files[path];
    const match = path.match(/^api\/(.+)\.json$/);
    if (match && endpointConfigs[match[1]]) {
      return { auth: { public: true }, ...endpointConfigs[match[1]] };
    }
    return null;
  });
  const context = testContext({
    connections: {
      Anthropic: { create: jest.fn(() => ({ provider: 'mock-provider' })), requests: {} },
      TestConnection: { schema: {}, requests: { CallInner: callInnerResolver } },
    },
    logger,
    operators: { ...operatorsServer },
    readConfigFile,
    user,
  });
  context.agents = { TestAgent: { resolver: agentResolver, schema: {} } };
  return context;
}

async function chatToolCall({ endpointId, input = {}, conversationId = 'conv_1', messages = [] }) {
  toolCall = { endpointId, input };
  const context = createContext();
  const { response } = await callAgent(context, {
    agentId: 'support_agent',
    conversationId,
    messages,
    pageId: 'chat',
  });
  expect(response.success).toBe(true);
  return response.response;
}

const supportAgent = {
  id: 'support_agent',
  conversationId: 'conv_1',
  files: [],
  all: { id: 'support_agent', conversationId: 'conv_1', files: [] },
};

// A chat whose first message carries an upload and whose third carries a pasted, inline image.
const chatWithFiles = [
  {
    id: 'm1',
    role: 'user',
    parts: [
      { type: 'text', text: 'The save button does nothing.' },
      {
        type: 'file',
        url: 'https://files.example.com/org_1/nigel/user_1/f1/screenshot.png?sig=x',
        mediaType: 'image/png',
        filename: 'screenshot.png',
        providerMetadata: { lowdefy: { key: 'org_1/nigel/user_1/f1/screenshot.png' } },
      },
    ],
  },
  { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Which page?' }] },
  {
    id: 'm3',
    role: 'user',
    parts: [
      { type: 'text', text: 'The ticket page. Write it up.' },
      { type: 'file', url: 'iVBORw0KGgo=', mediaType: 'image/png', filename: 'pasted.png' },
    ],
  },
];

const chatFiles = [
  {
    key: 'org_1/nigel/user_1/f1/screenshot.png',
    filename: 'screenshot.png',
    mediaType: 'image/png',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('an endpoint called as an agent tool from a chat reads the agent and its conversation', async () => {
  expect(await chatToolCall({ endpointId: 'whoami' })).toEqual(supportAgent);
});

test('an endpoint a tool endpoint calls through CallApi reads the same agent', async () => {
  expect(await chatToolCall({ endpointId: 'nested_call_api' })).toEqual(supportAgent);
});

test('an endpoint a tool endpoint request calls through callApi reads the same agent', async () => {
  expect(await chatToolCall({ endpointId: 'nested_request_call_api' })).toEqual(supportAgent);
});

test('a CallApi inside a control of a tool endpoint passes the agent on', async () => {
  expect(await chatToolCall({ endpointId: 'nested_in_control' })).toEqual(supportAgent);
});

test('a tool payload carrying agentId or agent fields changes nothing', async () => {
  expect(await chatToolCall({ endpointId: 'whoami', input: spoofPayload })).toEqual(supportAgent);
});

test('a chat without a conversation id gives a null conversationId', async () => {
  expect(await chatToolCall({ endpointId: 'whoami', conversationId: null })).toEqual({
    id: 'support_agent',
    conversationId: null,
    files: [],
    all: { id: 'support_agent', conversationId: null, files: [] },
  });
});

test('a tool endpoint reads the files of every message the chat request carried', async () => {
  const result = await chatToolCall({ endpointId: 'whoami', messages: chatWithFiles });
  expect(result.files).toEqual(chatFiles);
  expect(result.all.files).toEqual(chatFiles);
});

test('an endpoint a tool endpoint calls through CallApi reads the same files', async () => {
  const result = await chatToolCall({ endpointId: 'nested_call_api', messages: chatWithFiles });
  expect(result.files).toEqual(chatFiles);
});

test('a tool payload naming files changes nothing', async () => {
  const result = await chatToolCall({
    endpointId: 'whoami',
    input: { files: [{ key: 'org_1/nigel/user_2/secret.png', filename: 'secret.png' }] },
    messages: chatWithFiles,
  });
  expect(result.files).toEqual(chatFiles);
});

test('a tool called by a headless CallAgent step reads the agent with a null conversationId', async () => {
  toolCall = { endpointId: 'whoami', input: spoofPayload };
  const context = createContext();
  context.evaluateOperators = createEvaluateOperators(context);
  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
  };
  await runRoutine(context, routineContext, {
    routine: {
      id: 'agent:runner:run_agent',
      type: 'CallAgent',
      stepId: 'run_agent',
      endpointId: 'runner',
      properties: { agentId: 'support_agent', prompt: 'Look yourself up.' },
    },
  });
  expect(routineContext.steps.run_agent.response).toEqual({
    id: 'support_agent',
    conversationId: null,
    files: [],
    all: { id: 'support_agent', conversationId: null, files: [] },
  });
});

test('a browser call reads no agent, even with a payload that names one', async () => {
  const context = createContext();
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'whoami',
    pageId: 'p',
    payload: spoofPayload,
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual(noAgent);
});

test('a CallApi from a browser call reads no agent', async () => {
  const context = createContext();
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'nested_call_api',
    pageId: 'p',
    payload: {},
  });
  expect(result.response).toEqual(noAgent);
});

test('an MCP tool call reads no agent', async () => {
  const context = createContext();
  context.mcpAuth = { orgId: 'org_1', tokenStatus: 'none', parseableJwt: true };
  const server = await createMcpServer({ context });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  const result = await client.callTool({ name: 'whoami', arguments: spoofPayload });
  expect(result.isError).toBeFalsy();
  expect(JSON.parse(result.content[0].text)).toEqual(noAgent);
});

test('a scheduled endpoint reads no agent', async () => {
  const context = createContext({ user: null });
  const result = await runScheduledEndpoint(context, {
    endpointId: 'scheduled_whoami',
    cron: '0 6 * * *',
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual(noAgent);
});

test('a detached CallApi from a tool endpoint carries the agent to the detached run', async () => {
  process.env.CRON_SECRET = 'cron-secret';
  const fetchMock = jest.fn(async () => ({ status: 200 }));
  global.fetch = fetchMock;
  toolCall = { endpointId: 'detached_dispatch', input: {} };
  const context = createContext();
  context.origin = 'https://app.test';
  await callAgent(context, {
    agentId: 'support_agent',
    conversationId: 'conv_1',
    messages: [],
    pageId: 'chat',
  });
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.principal.agent).toEqual({
    id: 'support_agent',
    conversationId: 'conv_1',
    files: [],
  });

  const detachedContext = createContext();
  const result = await runDetachedEndpoint(detachedContext, {
    endpointId: 'whoami',
    payload: body.payload,
    principal: body.principal,
  });
  expect(result.response).toEqual(supportAgent);
  delete process.env.CRON_SECRET;
});

test('a detached run dispatched without an agent reads no agent', async () => {
  const context = createContext();
  const result = await runDetachedEndpoint(context, {
    endpointId: 'whoami',
    payload: {},
    principal: { user: null, system: true, agent: null },
  });
  expect(result.response).toEqual(noAgent);
});
