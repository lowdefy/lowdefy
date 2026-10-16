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
    build: { status: 'ok', warnings: ['w'] },
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
