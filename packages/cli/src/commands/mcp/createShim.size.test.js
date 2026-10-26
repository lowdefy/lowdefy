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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import devToolDefinitions, {
  INSTRUCTIONS,
} from '@lowdefy/server-dev/lib/docs/devToolDefinitions.js';
import { expect, test } from 'vitest';

import createShim from './createShim.js';

// The tool list is built the way scripts/generateDevTools.mjs builds
// devTools.json, so this measures what a current server's agents pay for.
async function listDevTools() {
  const server = new McpServer({ name: 'lowdefy-dev-tools', version: '1.0.0' });
  Object.entries(devToolDefinitions).forEach(([name, definition]) => {
    server.registerTool(name, definition, () => ({ content: [] }));
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'size-test', version: '1.0.0' });
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  await client.close();
  return tools;
}

// Every agent session pays for the shim's tool list before it does any work,
// lifecycle tools and the added directory property included. Growing it past
// this is a deliberate change.
test('the shim tools/list for a current dev server stays at most 40,000 characters', async () => {
  const tools = await listDevTools();
  const shim = createShim({
    cliVersion: '7.0.0',
    cliDirectory: process.cwd(),
    cwd: process.cwd(),
    devTools: { instructions: INSTRUCTIONS, tools },
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await shim.server.connect(serverTransport);
  const client = new Client({ name: 'size-test', version: '1.0.0' });
  await client.connect(clientTransport);
  const { tools: shimTools } = await client.listTools();
  expect(JSON.stringify(shimTools).length).toBeLessThanOrEqual(40000);
  await client.close();
  await shim.close();
});
