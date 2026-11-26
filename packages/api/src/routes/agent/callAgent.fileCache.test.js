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

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { LRUCache } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import callAgent from './callAgent.js';
import createReadConfigFile from '../../context/createReadConfigFile.js';
import testContext from '../../test/testContext.js';

// The servers read build artifacts through one module-level file cache, so every request on a
// server process gets the same deserialized agent config. These tests run chats from different
// users through one such cache and check each chat's agent is evaluated for its own caller.

const agentConfig = {
  agentId: 'assistant',
  auth: { public: true },
  id: 'agent:assistant',
  type: 'ClaudeAgent',
  connectionId: 'anthropic',
  mcp: [{ connectionId: 'docs-mcp' }],
  properties: {
    model: 'test-model',
    instructions: {
      '_string.concat': [
        'You help ',
        { _user: 'name' },
        ' with ',
        { _payload: 'sharedState.companyName' },
        '.',
      ],
    },
  },
};

const anthropicConnectionConfig = {
  connectionId: 'anthropic',
  id: 'connection:anthropic',
  type: 'Anthropic',
  properties: { apiKey: 'test-key' },
};

const mcpConnectionConfig = {
  connectionId: 'docs-mcp',
  id: 'connection:docs-mcp',
  type: 'TestMcp',
  properties: {
    url: 'https://mcp.example.com',
    headers: { 'x-user-id': { _user: 'sub' } },
  },
};

let buildDirectory;

beforeAll(async () => {
  buildDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lowdefy-agent-file-cache-'));
  await fs.mkdir(path.join(buildDirectory, 'agents'));
  await fs.mkdir(path.join(buildDirectory, 'connections'));
  await fs.writeFile(
    path.join(buildDirectory, 'agents/assistant.json'),
    JSON.stringify(agentConfig)
  );
  await fs.writeFile(
    path.join(buildDirectory, 'connections/anthropic.json'),
    JSON.stringify(anthropicConnectionConfig)
  );
  await fs.writeFile(
    path.join(buildDirectory, 'connections/docs-mcp.json'),
    JSON.stringify(mcpConnectionConfig)
  );
});

afterAll(async () => {
  await fs.rm(buildDirectory, { recursive: true, force: true });
});

function createServer() {
  const readConfigFile = createReadConfigFile({
    buildDirectory,
    fileCache: new LRUCache({ maxSize: 100 }),
  });
  const resolver = vi.fn().mockResolvedValue({ response: {} });

  async function chat({ user, sharedState }) {
    const context = testContext({
      readConfigFile,
      user,
      operators: operatorsServer,
      connections: {
        Anthropic: { create: () => ({ provider: vi.fn() }), requests: {} },
        TestMcp: {
          create: ({ connection }) => ({
            type: 'http',
            url: connection.url,
            headers: connection.headers,
          }),
          requests: {},
        },
      },
    });
    context.agents = { ClaudeAgent: { resolver, schema: {} } };
    await callAgent(context, { agentId: 'assistant', pageId: 'home', messages: [], sharedState });
    return resolver.mock.lastCall[0].properties.agent;
  }

  return { chat, readConfigFile };
}

test('callAgent evaluates agent properties for each caller when chats share the config file cache', async () => {
  const { chat } = createServer();

  const first = await chat({
    user: { sub: 'user-a', name: 'Alex' },
    sharedState: { companyName: 'Company A' },
  });
  const second = await chat({
    user: { sub: 'user-b', name: 'Blake' },
    sharedState: { companyName: 'Company B' },
  });

  expect(first.properties.instructions).toBe('You help Alex with Company A.');
  expect(second.properties.instructions).toBe('You help Blake with Company B.');
});

test('callAgent resolves agent MCP connections for each caller when chats share the config file cache', async () => {
  const { chat } = createServer();

  const first = await chat({ user: { sub: 'user-a', name: 'Alex' }, sharedState: {} });
  const second = await chat({ user: { sub: 'user-b', name: 'Blake' }, sharedState: {} });

  expect(first.mcp).toEqual([
    { type: 'http', url: 'https://mcp.example.com', headers: { 'x-user-id': 'user-a' } },
  ]);
  expect(second.mcp).toEqual([
    { type: 'http', url: 'https://mcp.example.com', headers: { 'x-user-id': 'user-b' } },
  ]);
});

test('callAgent leaves the cached agent config as the build wrote it', async () => {
  const { chat, readConfigFile } = createServer();

  await chat({
    user: { sub: 'user-a', name: 'Alex' },
    sharedState: { companyName: 'Company A' },
  });

  expect(await readConfigFile('agents/assistant.json')).toEqual(agentConfig);
});
