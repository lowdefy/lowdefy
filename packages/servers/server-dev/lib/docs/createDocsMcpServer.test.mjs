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

import fs from 'fs';
import path from 'path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

import { jest } from '@jest/globals';

import setupTestFixtures from './setupTestFixtures.mjs';

// The docs service reads build artifacts from process.cwd() — point it at the
// fixture server before the modules are imported.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

// runJourney needs a browser; mocked so the tool's result shaping (JSON text
// followed by image blocks) can be asserted without one.
const mockRunJourney = jest.fn();
jest.unstable_mockModule('./runJourney.js', () => ({ default: mockRunJourney }));

const { default: createDocsMcpServer, subscribeMcpServerToDevEvents } = await import(
  './createDocsMcpServer.js'
);
const { publish } = await import('./devEventBus.js');

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
  'lowdefy_run_journey',
  'lowdefy_scaffold_page',
  'lowdefy_inspect_state',
  'lowdefy_eval_operator',
  'lowdefy_run_request',
  'lowdefy_run_endpoint',
  'lowdefy_restart',
  'lowdefy_app_map',
  'lowdefy_checkpoint',
  'lowdefy_revert_checkpoint',
  'lowdefy_snapshot_state',
  'lowdefy_load_state',
  'lowdefy_list_state_checkpoints',
  'lowdefy_checkpoint_to_mocks',
];

async function connectClient() {
  const { client } = await connectPair();
  return client;
}

async function connectPair() {
  const server = createDocsMcpServer({ origin: 'http://localhost:3000' });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

test('MCP server declares the logging capability and teaches the push channel', async () => {
  const client = await connectClient();
  expect(client.getServerCapabilities().logging).toEqual({});
  const instructions = client.getInstructions();
  expect(instructions).toContain('notifications/message');
  expect(instructions).toContain('logger "lowdefy"');
  await client.close();
});

test('subscribeMcpServerToDevEvents forwards bus events as notifications/message from logger lowdefy', async () => {
  const { client, server } = await connectPair();
  const received = [];
  client.setNotificationHandler(
    LoggingMessageNotificationSchema,
    (notification) => void received.push(notification.params)
  );
  const unsubscribe = subscribeMcpServerToDevEvents(server);

  publish({ type: 'client_error', timestamp: '2026-01-01T00:00:00.000Z', message: 'boom' });
  publish({ type: 'build', timestamp: '2026-01-01T00:00:01.000Z', status: 'error', errorCount: 1 });
  publish({ type: 'build', timestamp: '2026-01-01T00:00:02.000Z', status: 'ok', errorCount: 0 });
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(received).toEqual([
    {
      level: 'info',
      logger: 'lowdefy',
      data: { type: 'client_error', timestamp: '2026-01-01T00:00:00.000Z', message: 'boom' },
    },
    {
      level: 'error',
      logger: 'lowdefy',
      data: {
        type: 'build',
        timestamp: '2026-01-01T00:00:01.000Z',
        status: 'error',
        errorCount: 1,
      },
    },
    {
      level: 'info',
      logger: 'lowdefy',
      data: { type: 'build', timestamp: '2026-01-01T00:00:02.000Z', status: 'ok', errorCount: 0 },
    },
  ]);

  unsubscribe();
  publish({ type: 'client_error', message: 'after unsubscribe' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(received).toHaveLength(3);
  await client.close();
});

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

test('MCP tools that render a page headless advertise an optional user parameter', async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();

  [
    'lowdefy_screenshot_page',
    'lowdefy_run_journey',
    'lowdefy_inspect_state',
    'lowdefy_eval_operator',
    'lowdefy_load_state',
    'lowdefy_run_request',
    'lowdefy_run_endpoint',
  ].forEach((name) => {
    const tool = tools.find((candidate) => candidate.name === name);
    expect(tool.inputSchema.properties.user).toBeDefined();
    expect(tool.inputSchema.required ?? []).not.toContain('user');
  });

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

test('MCP get_schema, get_doc and find_config describe and return hazards', async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  for (const name of ['lowdefy_get_schema', 'lowdefy_get_doc', 'lowdefy_find_config']) {
    expect(tools.find((tool) => tool.name === name).description).toContain(
      'Results include `hazards`'
    );
  }

  const schema = await client.callTool({
    name: 'lowdefy_get_schema',
    arguments: { kind: 'blocks', type: 'TestBlock' },
  });
  expect(JSON.parse(schema.content[0].text).hazards[0].id).toEqual('test-block-hazard');

  const doc = await client.callTool({
    name: 'lowdefy_get_doc',
    arguments: { kind: 'operator', type: '_get' },
  });
  expect(doc.content[0].text).toContain('## Hazards');
  expect(doc.content[0].text).toContain(
    '**get-fixture-hazard**: _get fixture hazard. (see `operators/_get`)'
  );

  const found = await client.callTool({
    name: 'lowdefy_find_config',
    arguments: { id: 'my_button' },
  });
  expect(JSON.parse(found.content[0].text).matches[0].hazards[0].id).toEqual(
    'visible-false-prunes-state'
  );
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
  expect(parsed.kind).toEqual('page');
  expect(parsed.pageId).toEqual('home');
  expect(parsed.file).toEqual('pages/home.yaml');
  expect(parsed.matches[0].location.source).toContain('pages/home.yaml');
  await client.close();
});

test('MCP tools/call lowdefy_restart writes the restart sentinel and tells the caller to poll', async () => {
  const client = await connectClient();
  const result = await client.callTool({
    name: 'lowdefy_restart',
    arguments: { reason: 'edited a request plugin' },
  });
  const body = JSON.parse(result.content[0].text);
  expect(body.requested).toBe(true);
  expect(body.reason).toBe('edited a request plugin');
  expect(body.note).toContain('build-status');
  const sentinelPath = path.join(fixtureDir, 'build', '.restart');
  expect(JSON.parse(fs.readFileSync(sentinelPath, 'utf8')).reason).toBe('edited a request plugin');
  fs.rmSync(sentinelPath, { force: true });
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

// The dev server keeps serving the previous build when a rebuild fails, so
// every tool result must announce that its answer predates the caller's edits.
test('MCP tools/call prepends a STALE notice while the last build failed', async () => {
  const statusPath = path.join(fixtureDir, 'build', 'buildStatus.json');
  const okStatus = fs.readFileSync(statusPath, 'utf8');
  fs.writeFileSync(
    statusPath,
    JSON.stringify({
      status: 'error',
      timestamp: '2026-02-03T04:05:06.000Z',
      errors: [{ message: 'Block type "Buton" not found.' }],
      warnings: [],
    })
  );
  try {
    const client = await connectClient();
    const result = await client.callTool({
      name: 'lowdefy_get_schema',
      arguments: { kind: 'blocks', type: 'Button' },
    });
    expect(result.content[0].text.startsWith('STALE: ')).toBe(true);
    expect(result.content[0].text).toContain('"staleSince":"2026-02-03T04:05:06.000Z"');
    // The tool's own payload is untouched, just no longer first.
    const parsed = JSON.parse(result.content[1].text);
    expect(parsed.schema.properties.title).toBeDefined();
    await client.close();
  } finally {
    fs.writeFileSync(statusPath, okStatus);
  }

test('MCP tools/call lowdefy_run_journey returns the JSON result followed by one image per screenshot', async () => {
  mockRunJourney.mockResolvedValue({
    pageId: 'form',
    passed: false,
    steps: [{ index: 0, step: { screenshot: 'before' }, status: 'ok', durationMs: 3 }],
    failure: { index: 1, step: { click: 'nope' }, expected: 'x', actual: 'y', message: 'm' },
    screenshots: [
      { name: 'before', data: 'AAAA', mimeType: 'image/png' },
      { name: 'after', data: 'BBBB', mimeType: 'image/png' },
    ],
    state: { saved: false },
  });
  const client = await connectClient();

  const result = await client.callTool({
    name: 'lowdefy_run_journey',
    arguments: {
      pageId: 'form',
      steps: [{ screenshot: 'before' }, { click: 'nope' }],
      user: { roles: ['admin'] },
      urlQuery: { id: '1' },
    },
  });

  expect(mockRunJourney).toHaveBeenCalledWith({
    origin: 'http://localhost:3000',
    pageId: 'form',
    steps: [{ screenshot: 'before' }, { click: 'nope' }],
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
  });
  expect(result.content).toHaveLength(3);
  const summary = JSON.parse(result.content[0].text);
  expect(summary.passed).toBe(false);
  expect(summary.failure.index).toBe(1);
  expect(summary.state).toEqual({ saved: false });
  expect(summary.screenshots).toEqual([{ name: 'before' }, { name: 'after' }]);
  expect(result.content[1]).toEqual({ type: 'image', data: 'AAAA', mimeType: 'image/png' });
  expect(result.content[2]).toEqual({ type: 'image', data: 'BBBB', mimeType: 'image/png' });
  await client.close();
});

test('MCP tools/call lowdefy_run_journey reports a runner error as a tool error', async () => {
  mockRunJourney.mockResolvedValue({ error: 'Step 0: Unknown journey step "hover".' });
  const client = await connectClient();

  const result = await client.callTool({
    name: 'lowdefy_run_journey',
    arguments: { pageId: 'form', steps: [{ hover: 'a' }] },
  });

  expect(result.isError).toBe(true);
  expect(result.content[0].text).toEqual('Step 0: Unknown journey step "hover".');
  await client.close();
});

test('MCP instructions teach lowdefy_run_journey as the way to verify behaviour', async () => {
  const client = await connectClient();
  const instructions = client.getInstructions();
  expect(instructions).toContain('lowdefy_run_journey');
  expect(instructions).toContain('verify behaviour');
  await client.close();
});
