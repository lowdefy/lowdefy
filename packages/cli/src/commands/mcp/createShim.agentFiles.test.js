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
import http from 'http';
import os from 'os';
import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import createShim from './createShim.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

const VERSION = '7.1.0';

const MISMATCH = {
  code: 'version_mismatch',
  message:
    "Agent instructions are from Lowdefy 7.0.3, this app runs 7.1.0, so some of their guidance may not apply. Tell the developer; don't run agent-setup yourself. They fix it with `npx lowdefy@7.1.0 agent-setup`, unless another app in this repository runs a different version.",
};

const IMPORT_MISSING = {
  code: 'claude_import_missing',
  message:
    'Claude Code may not read AGENTS.md. Tell the developer: add `@AGENTS.md` to the top of CLAUDE.md, or run agent-setup.',
};

const devTools = {
  instructions: 'Dev server instructions.',
  tools: [
    {
      name: 'lowdefy_build_status',
      description: 'Build status.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
};

let root;
let home;
let client;
let shim;
let devServers;
// The arguments each fake dev server tool call received, in order.
let receivedArgs;
const originalHome = process.env.LOWDEFY_HOME;

// A dev server's MCP endpoint answering each tool with the text its
// `answers` entry holds now, as the dev server's textResult serialises it.
async function startFakeDevServer(answers) {
  const httpServer = http.createServer(async (req, res) => {
    const server = new Server(
      { name: 'lowdefy', version: VERSION },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: Object.keys(answers).map((name) => ({
        name,
        description: `${name}.`,
        inputSchema: { type: 'object', properties: {} },
      })),
    }));
    server.setRequestHandler(CallToolRequestSchema, (request) => {
      receivedArgs.push({ name: request.params.name, arguments: request.params.arguments });
      const answer = answers[request.params.name];
      const text = typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2);
      return { content: [{ type: 'text', text }] };
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  devServers.push(httpServer);
  return httpServer;
}

// An app with a running terminal dev server, which the shim uses as it is.
async function makeApp(relativePath, answers) {
  const app = path.join(root, relativePath);
  fs.mkdirSync(path.join(app, '.lowdefy'), { recursive: true });
  fs.writeFileSync(path.join(app, 'lowdefy.yaml'), `lowdefy: ${VERSION}\n`);
  const devServer = await startFakeDevServer(answers);
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({
      pid: process.pid,
      configDirectory: app,
      owner: 'terminal',
      state: 'ready',
      url: `http://127.0.0.1:${devServer.address().port}`,
      version: VERSION,
    })
  );
  return app;
}

async function connect() {
  shim = createShim({ cliVersion: VERSION, cliDirectory: root, cwd: root, devTools });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await shim.server.connect(serverTransport);
  client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
}

// The forwarded content after the shim's app label line.
async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).toBeFalsy();
  return result.content.slice(1).map((item) => item.text);
}

async function buildStatus(args) {
  const [text] = await call('lowdefy_build_status', args);
  return JSON.parse(text);
}

beforeEach(() => {
  root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-notes-')));
  fs.mkdirSync(path.join(root, '.git'));
  // No hub runs here, and none may be started by the tests.
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-notes-home-'));
  process.env.LOWDEFY_HOME = home;
  devServers = [];
  receivedArgs = [];
});

afterEach(async () => {
  await client?.close();
  await shim?.close();
  for (const devServer of devServers) {
    devServer.closeAllConnections();
    await new Promise((resolve) => devServer.close(resolve));
  }
  process.env.LOWDEFY_HOME = originalHome;
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  fs.rmSync(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

test('passes a notice on once, then leaves agentFiles out and the rest of the result as it was', async () => {
  const status = {
    buildId: 'b1',
    build: { status: 'ok', warnings: [] },
    agentFiles: [MISMATCH],
  };
  await makeApp('.', { lowdefy_build_status: status });
  await connect();

  const first = await call('lowdefy_build_status');
  expect(first).toEqual([JSON.stringify(status, null, 2)]);

  const second = await call('lowdefy_build_status');
  const { agentFiles, ...rest } = status;
  expect(second).toEqual([JSON.stringify(rest, null, 2)]);
});

test('passes on only the notices not said yet', async () => {
  const answers = { lowdefy_build_status: { build: { status: 'ok' }, agentFiles: [MISMATCH] } };
  await makeApp('.', answers);
  await connect();

  await buildStatus();
  answers.lowdefy_build_status = {
    build: { status: 'ok' },
    agentFiles: [MISMATCH, IMPORT_MISSING],
  };

  expect((await buildStatus()).agentFiles).toEqual([IMPORT_MISSING]);
});

test('passes on a notice again when its text changes', async () => {
  const answers = { lowdefy_build_status: { agentFiles: [MISMATCH] } };
  await makeApp('.', answers);
  await connect();

  await buildStatus();
  const changed = { code: 'version_mismatch', message: MISMATCH.message.replace('7.0.3', '6.9.0') };
  answers.lowdefy_build_status = { agentFiles: [changed] };

  expect((await buildStatus()).agentFiles).toEqual([changed]);
  expect(await buildStatus()).not.toHaveProperty('agentFiles');
});

test('says the same notice once for each app', async () => {
  await makeApp('apps/one', { lowdefy_build_status: { agentFiles: [MISMATCH] } });
  await makeApp('apps/two', { lowdefy_build_status: { agentFiles: [MISMATCH] } });
  await connect();

  expect((await buildStatus({ directory: 'apps/one' })).agentFiles).toEqual([MISMATCH]);
  expect((await buildStatus({ directory: 'apps/two' })).agentFiles).toEqual([MISMATCH]);
  expect(await buildStatus({ directory: 'apps/one' })).not.toHaveProperty('agentFiles');
  expect(await buildStatus({ directory: 'apps/two' })).not.toHaveProperty('agentFiles');
});

test('leaves a result that does not parse, or has no agentFiles, unchanged', async () => {
  const answers = { lowdefy_build_status: 'Not JSON {' };
  await makeApp('.', answers);
  await connect();

  expect(await call('lowdefy_build_status')).toEqual(['Not JSON {']);
  // Formatted unlike the dev server's JSON: untouched, not re-serialised.
  answers.lowdefy_build_status = '{"build":{"status":"ok"}}';
  expect(await call('lowdefy_build_status')).toEqual(['{"build":{"status":"ok"}}']);
});

test('never alters another tool result', async () => {
  const other = { agentFiles: [MISMATCH] };
  devTools.tools.push({
    name: 'lowdefy_other',
    description: 'Other.',
    inputSchema: { type: 'object', properties: {} },
  });
  try {
    await makeApp('.', { lowdefy_build_status: other, lowdefy_other: other });
    await connect();

    await buildStatus();
    expect(await call('lowdefy_other')).toEqual([JSON.stringify(other, null, 2)]);
    expect(await call('lowdefy_other')).toEqual([JSON.stringify(other, null, 2)]);
  } finally {
    devTools.tools.pop();
  }
});

const WARNING_A = { message: 'Block type "Buton" is deprecated.', source: 'pages/a.yaml:3' };
const WARNING_B = { message: '_state references undefined blockId.', source: 'pages/b.yaml:9' };

test('shows each build warning in full once, then counts it while it stays unchanged', async () => {
  const answers = {
    lowdefy_build_status: {
      build: { status: 'ok', errors: [], warnings: [WARNING_A, WARNING_B] },
    },
  };
  await makeApp('.', answers);
  await connect();

  expect((await buildStatus()).build.warnings).toEqual([WARNING_A, WARNING_B]);

  const second = await buildStatus();
  expect(second.build.warnings).toEqual([]);
  expect(second.build.warningsUnchanged).toEqual({
    count: 2,
    note: "2 warning(s) unchanged since the last lowdefy_build_status answer this session (yours or another agent's) are left out. Call with all: true to list every warning.",
  });
});

test('a new session, or another agent with its own lowdefy mcp, gets every warning in full once', async () => {
  const answers = {
    lowdefy_build_status: { build: { status: 'ok', errors: [], warnings: [WARNING_A, WARNING_B] } },
  };
  await makeApp('.', answers);
  await connect();
  await buildStatus();
  expect((await buildStatus()).build.warningsUnchanged.count).toBe(2);
  await client.close();
  await shim.close();

  await connect();
  const first = await buildStatus();
  expect(first.build.warnings).toEqual([WARNING_A, WARNING_B]);
  expect(first.build.warningsUnchanged).toBeUndefined();
  expect((await buildStatus()).build.warningsUnchanged.count).toBe(2);
});

test('shows new, changed and returning warnings in full, and every error', async () => {
  const errors = [{ message: 'Broken.', source: 'pages/c.yaml:1' }];
  const answers = {
    lowdefy_build_status: { build: { status: 'error', errors, warnings: [WARNING_A, WARNING_B] } },
  };
  await makeApp('.', answers);
  await connect();
  await buildStatus();

  const changed = { ...WARNING_B, source: 'pages/b.yaml:10' };
  answers.lowdefy_build_status = {
    build: { status: 'error', errors, warnings: [WARNING_A, changed] },
  };
  const second = await buildStatus();
  expect(second.build.errors).toEqual(errors);
  expect(second.build.warnings).toEqual([changed]);
  expect(second.build.warningsUnchanged.count).toBe(1);

  answers.lowdefy_build_status = { build: { status: 'error', errors, warnings: [changed] } };
  expect((await buildStatus()).build.warningsUnchanged.count).toBe(1);
  answers.lowdefy_build_status = {
    build: { status: 'error', errors, warnings: [WARNING_A, changed] },
  };
  // WARNING_A went away for one answer, so it comes back in full.
  expect((await buildStatus()).build.warnings).toEqual([WARNING_A]);
});

test('lists every warning with all: true, without passing all to the dev server', async () => {
  const status = { build: { status: 'ok', warnings: [WARNING_A] } };
  await makeApp('.', { lowdefy_build_status: status });
  await connect();
  await buildStatus();

  expect(await call('lowdefy_build_status', { all: true, wait: true })).toEqual([
    JSON.stringify(status, null, 2),
  ]);
  expect(receivedArgs.at(-1)).toEqual({ name: 'lowdefy_build_status', arguments: { wait: true } });
  expect((await buildStatus()).build.warningsUnchanged.count).toBe(1);
});

test('passes all on to another tool', async () => {
  devTools.tools.push({
    name: 'lowdefy_other',
    description: 'Other.',
    inputSchema: { type: 'object', properties: {} },
  });
  try {
    await makeApp('.', { lowdefy_build_status: {}, lowdefy_other: {} });
    await connect();

    await call('lowdefy_other', { all: true });
    expect(receivedArgs.at(-1)).toEqual({ name: 'lowdefy_other', arguments: { all: true } });
  } finally {
    devTools.tools.pop();
  }
});

test('counts a warning whose configKey alone changed, as every config build changes them', async () => {
  const answers = {
    lowdefy_build_status: {
      build: { status: 'ok', warnings: [{ ...WARNING_A, configKey: 'a1_o1' }] },
    },
  };
  await makeApp('.', answers);
  await connect();
  await buildStatus();

  answers.lowdefy_build_status = {
    build: { status: 'ok', warnings: [{ ...WARNING_A, configKey: 'b2_o9' }] },
  };
  const second = await buildStatus();
  expect(second.build.warnings).toEqual([]);
  expect(second.build.warningsUnchanged.count).toBe(1);
});

test('leaves out a passed-on notice and unchanged warnings from one answer', async () => {
  const status = { build: { status: 'ok', warnings: [WARNING_A] }, agentFiles: [MISMATCH] };
  await makeApp('.', { lowdefy_build_status: status });
  await connect();
  await buildStatus();

  const second = await buildStatus();
  expect(second).not.toHaveProperty('agentFiles');
  expect(second.build.warnings).toEqual([]);
  expect(second.build.warningsUnchanged.count).toBe(1);
});

test('remembers shown warnings for each app apart', async () => {
  const status = { build: { status: 'ok', warnings: [WARNING_A] } };
  await makeApp('apps/one', { lowdefy_build_status: status });
  await makeApp('apps/two', { lowdefy_build_status: status });
  await connect();

  await buildStatus({ directory: 'apps/one' });
  expect((await buildStatus({ directory: 'apps/two' })).build.warnings).toEqual([WARNING_A]);
  expect((await buildStatus({ directory: 'apps/one' })).build.warnings).toEqual([]);
});

test('lists all on build status and describes the warnings it leaves out', async () => {
  await makeApp('.', { lowdefy_build_status: { build: { status: 'ok' } } });
  await connect();

  const { tools } = await client.listTools();
  const tool = tools.find((entry) => entry.name === 'lowdefy_build_status');
  expect(tool.inputSchema.properties.all.type).toBe('boolean');
  expect(tool.description).toMatch(
    /Warnings unchanged since the last call this session are counted, not listed\.$/
  );
});
