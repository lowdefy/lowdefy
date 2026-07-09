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

import setupTestFixtures from './setupTestFixtures.mjs';

// The docs service reads build artifacts from process.cwd() — point it at the
// fixture server before the modules are imported.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

const { default: createDocsMcpServer } = await import('./createDocsMcpServer.js');

const EXPECTED_TOOLS = [
  'lowdefy_overview',
  'lowdefy_list_types',
  'lowdefy_list_plugins',
  'lowdefy_get_schema',
  'lowdefy_get_examples',
  'lowdefy_get_doc',
  'lowdefy_search_docs',
  'lowdefy_get_plugin_doc',
  'lowdefy_build_status',
  'lowdefy_get_page_config',
  'lowdefy_find_config',
  'lowdefy_screenshot_page',
  'lowdefy_scaffold_page',
];

async function connectClient() {
  const server = createDocsMcpServer({ origin: 'http://localhost:3000' });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

test('MCP server exposes instructions teaching the feedback loop', async () => {
  const client = await connectClient();
  const instructions = client.getInstructions();
  expect(instructions).toContain('lowdefy_build_status');
  expect(instructions).toContain('never guess type names');
  await client.close();
});

test('MCP tools/list returns all lowdefy tools', async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  expect(names).toEqual([...EXPECTED_TOOLS].sort());
  await client.close();
});

test('MCP tools/call lowdefy_get_schema returns a block schema', async () => {
  const client = await connectClient();
  const result = await client.callTool({
    name: 'lowdefy_get_schema',
    arguments: { kind: 'blocks', type: 'Button' },
  });
  const parsed = JSON.parse(result.content[0].text);
  expect(parsed.schema.properties.title).toBeDefined();
  await client.close();
});

test('MCP tools/call lowdefy_build_status returns build status with client errors', async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: 'lowdefy_build_status', arguments: {} });
  const parsed = JSON.parse(result.content[0].text);
  expect(parsed.build.status).toEqual('ok');
  expect(Array.isArray(parsed.clientErrors)).toBe(true);
  await client.close();
});

test('MCP tools/call lowdefy_find_config locates a block by id', async () => {
  const client = await connectClient();
  const result = await client.callTool({
    name: 'lowdefy_find_config',
    arguments: { id: 'home' },
  });
  const parsed = JSON.parse(result.content[0].text);
  expect(parsed).toEqual({ kind: 'page', pageId: 'home', file: 'pages/home.yaml' });
  await client.close();
});

test('MCP tools/call with an unknown type returns isError with guidance', async () => {
  const client = await connectClient();
  const result = await client.callTool({
    name: 'lowdefy_get_schema',
    arguments: { kind: 'blocks', type: 'NoSuchBlock' },
  });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('lowdefy_list_types');
  await client.close();
});
