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
import net from 'net';
import os from 'os';
import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import getHubPaths from '../hub/getHubPaths.js';
import { HUB_PROTOCOL } from '../hub/hubProtocol.js';
import createShim from './createShim.js';

const devTools = {
  instructions: 'Dev server instructions.',
  tools: [
    {
      name: 'lowdefy_build_status',
      description: 'Build status.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'lowdefy_restart',
      description: 'Restart.',
      inputSchema: { type: 'object', properties: { reason: { type: 'string' } } },
    },
  ],
};

let root;
let home;
let client;
let shim;
const originalHome = process.env.LOWDEFY_HOME;

async function connect({ cwd, onElicit }) {
  shim = createShim({ cliVersion: '6.0.0', cwd, devTools });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await shim.server.connect(serverTransport);
  client = new Client(
    { name: 'test', version: '1.0.0' },
    { capabilities: onElicit ? { elicitation: {} } : {} }
  );
  if (onElicit) {
    client.setRequestHandler(ElicitRequestSchema, onElicit);
  }
  await client.connect(clientTransport);
}

function makeApp(relativePath) {
  const directory = path.join(root, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  return directory;
}

function text(result) {
  return result.content.map((item) => item.text).join('\n');
}

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-')));
  fs.mkdirSync(path.join(root, '.git'));
  // No hub runs here, and none may be started by the tests.
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-home-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(async () => {
  await client?.close();
  await shim?.close();
  process.env.LOWDEFY_HOME = originalHome;
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});

test('lowdefy mcp lists the lifecycle tools and every dev tool with a directory argument, but one restart tool', async () => {
  await connect({ cwd: root });
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);
  expect(names).toEqual([
    'lowdefy_dev_start',
    'lowdefy_dev_stop',
    'lowdefy_dev_status',
    'lowdefy_dev_logs',
    'lowdefy_run_tests',
    'lowdefy_dev_list',
    'lowdefy_build_status',
  ]);
  const buildStatus = tools.find((tool) => tool.name === 'lowdefy_build_status');
  expect(buildStatus.inputSchema.properties.directory.type).toEqual('string');
  expect(client.getInstructions()).toContain('never run `lowdefy dev` yourself');
  expect(client.getInstructions()).toContain('Dev server instructions.');
  expect(client.getInstructions()).toContain(
    'When you finish work in a git worktree you created for the task, call lowdefy_dev_stop with that "directory" before you report back.'
  );
  expect(client.getInstructions()).toContain(
    'A server left running stops once it has been idle for 15 minutes.'
  );
});

// Stands in for the per-user hub on its socket: answers each request with what
// a hub that has started the app would.
async function listenFakeHub({ configDirectory }) {
  const { socketPath } = getHubPaths();
  fs.mkdirSync(path.dirname(socketPath), { recursive: true });
  const answers = {
    hello: { protocol: HUB_PROTOCOL, version: '6.0.0', pid: process.pid },
    attach: { attached: true },
    start: {
      configDirectory,
      owner: 'hub',
      state: 'ready',
      url: 'http://localhost:4100',
      pid: process.pid,
      managed: true,
    },
  };
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let buffered = '';
    socket.on('data', (chunk) => {
      buffered += chunk;
      let newline = buffered.indexOf('\n');
      while (newline !== -1) {
        const { id, method } = JSON.parse(buffered.slice(0, newline));
        buffered = buffered.slice(newline + 1);
        socket.write(`${JSON.stringify({ id, result: answers[method] })}\n`);
        newline = buffered.indexOf('\n');
      }
    });
    socket.on('error', () => {});
  });
  await new Promise((resolve) => server.listen(socketPath, resolve));
  return server;
}

test('lowdefy_dev_start says the hub stops the server once it has been idle', async () => {
  const app = makeApp('apps/main');
  const hub = await listenFakeHub({ configDirectory: app });
  try {
    await connect({ cwd: app });
    const result = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(text(result)).toContain('"state": "ready"');
    expect(text(result)).toContain(
      'The hub stops this server once nobody has used it for 15 minutes (sooner when the machine is short of memory); the next lowdefy_ call starts it again.'
    );
  } finally {
    await client.close();
    await shim.close();
    client = undefined;
    shim = undefined;
    await new Promise((resolve) => hub.close(resolve));
  }
});

test('lowdefy mcp answers a dev tool call in a multi-app checkout with the apps to choose from', async () => {
  makeApp('apps/main');
  makeApp('apps/second');
  await connect({ cwd: root });
  const result = await client.callTool({ name: 'lowdefy_build_status', arguments: {} });
  expect(result.isError).toBe(true);
  expect(text(result)).toContain('apps/main');
  expect(text(result)).toContain('apps/second');
});

test('lowdefy_dev_status reports a terminal dev server from its instance record without starting a hub', async () => {
  const app = makeApp('apps/main');
  fs.mkdirSync(path.join(app, '.lowdefy'));
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({
      pid: process.pid,
      configDirectory: app,
      owner: 'terminal',
      state: 'starting',
      url: 'http://localhost:3000',
    })
  );
  await connect({ cwd: root });
  const result = await client.callTool({ name: 'lowdefy_dev_status', arguments: {} });
  const status = JSON.parse(text(result));
  expect(status).toMatchObject({
    app: `apps/main @ ${path.basename(root)}`,
    owner: 'terminal',
    state: 'starting',
  });
  expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
});

test('lowdefy_run_tests reports that there are no tests without starting anything', async () => {
  const app = makeApp('.');
  fs.mkdirSync(path.join(app, '.lowdefy'));
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({
      pid: process.pid,
      configDirectory: app,
      owner: 'terminal',
      state: 'ready',
      url: 'http://localhost:3999',
    })
  );
  await connect({ cwd: root });
  const result = JSON.parse(
    text(await client.callTool({ name: 'lowdefy_run_tests', arguments: {} }))
  );
  expect(result.summary).toEqual('No tests found. Add journeys to tests/journeys/*.yaml.');
  expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
});

test('lowdefy_dev_stop refuses a dev server the user runs in a terminal', async () => {
  const app = makeApp('.');
  fs.mkdirSync(path.join(app, '.lowdefy'));
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({ pid: process.pid, configDirectory: app, owner: 'terminal', state: 'ready' })
  );
  await connect({ cwd: root });
  const result = JSON.parse(
    text(await client.callTool({ name: 'lowdefy_dev_stop', arguments: {} }))
  );
  expect(result.stopped).toBe(false);
  expect(result.reason).toContain("runs in the user's terminal");
});

test('lowdefy_dev_list lists every app of a multi-app checkout without starting a hub', async () => {
  makeApp('apps/main');
  makeApp('apps/second');
  await connect({ cwd: root });
  const result = await client.callTool({ name: 'lowdefy_dev_list', arguments: {} });
  expect(result.isError).toBeUndefined();
  expect(JSON.parse(text(result)).apps).toEqual([
    expect.objectContaining({ app: `apps/main @ ${path.basename(root)}`, state: 'stopped' }),
    expect.objectContaining({ app: `apps/second @ ${path.basename(root)}`, state: 'stopped' }),
  ]);
  expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
});

test('lowdefy mcp refuses a directory in another checkout and asks the user when the client can', async () => {
  makeApp('.');
  const other = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-other-')));
  fs.mkdirSync(path.join(other, '.git'));
  fs.writeFileSync(path.join(other, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  const questions = [];
  try {
    await connect({
      cwd: root,
      onElicit: (request) => {
        questions.push(request.params.message);
        return { action: 'decline' };
      },
    });
    const result = await client.callTool({
      name: 'lowdefy_build_status',
      arguments: { directory: other },
    });
    expect(result.isError).toBe(true);
    expect(text(result)).toEqual(
      `${other} is outside this session's checkout (${root}) and its git worktrees. The user declined to allow it for this session.`
    );
    expect(questions).toEqual([
      expect.stringContaining(`Allow ${JSON.stringify(other)} for this session?`),
    ]);
    expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});
