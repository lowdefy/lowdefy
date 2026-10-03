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

import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ElicitRequestSchema,
  ListToolsRequestSchema,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';

import createShim from './createShim.js';
import createLineReader from '../hub/createLineReader.js';
import getHubPaths from '../hub/getHubPaths.js';
import { HUB_PROTOCOL } from '../hub/hubProtocol.js';

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

async function connect({ cwd, onElicit, cliVersion = '6.0.0' }) {
  shim = createShim({ cliVersion, cwd, devTools });
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
  // The native realpath, as the shim resolves apps and the dev manager records
  // them: on Windows os.tmpdir() can be an 8.3 short path (RUNNER~1) that only
  // the native call expands, and a record naming the short path is not found.
  root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-')));
  fs.mkdirSync(path.join(root, '.git'));
  // No hub runs here, and none may be started by the tests.
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-home-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(async () => {
  await client?.close();
  await shim?.close();
  process.env.LOWDEFY_HOME = originalHome;
  // Windows can hold a just-closed child's handle on the directory for a
  // moment; rmSync retries EPERM and EBUSY.
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  fs.rmSync(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
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
// a hub that has started the app would. The app's dev server is a local
// server that records the paths asked of it.
async function listenFakeHub({ configDirectory, start = {} }) {
  const devRequests = [];
  const devServer = http.createServer((req, res) => {
    devRequests.push(req.url);
    res.end('ok');
  });
  await new Promise((resolve) => devServer.listen(0, '127.0.0.1', resolve));
  const { socketPath } = getHubPaths();
  fs.mkdirSync(path.dirname(socketPath), { recursive: true });
  const answers = {
    hello: { protocol: HUB_PROTOCOL, version: '6.0.0', pid: process.pid },
    attach: { attached: true },
    start: {
      configDirectory,
      owner: 'hub',
      state: 'ready',
      url: `http://127.0.0.1:${devServer.address().port}`,
      pid: process.pid,
      managed: true,
      ...start,
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
  return {
    devRequests,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await new Promise((resolve) => devServer.close(resolve));
    },
  };
}

test('lowdefy_dev_start counts as use and says the hub stops the server once it has been idle', async () => {
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
    // Asking for the server counts as using it.
    expect(hub.devRequests).toEqual(['/api/ping']);
  } finally {
    await client.close();
    await shim.close();
    client = undefined;
    shim = undefined;
    await hub.close();
  }
});

test('lowdefy_dev_start keeps the hub note when another hub owns the server', async () => {
  const app = makeApp('apps/main');
  const note = 'This dev server was started by another hub; it cannot be restarted from here.';
  const hub = await listenFakeHub({ configDirectory: app, start: { managed: false, note } });
  try {
    await connect({ cwd: app });
    const result = await client.callTool({
      name: 'lowdefy_dev_start',
      arguments: { restart: true },
    });
    expect(result.isError).toBeFalsy();
    expect(text(result)).toContain(note);
    expect(text(result)).not.toContain('The hub stops this server once nobody has used it');
  } finally {
    await client.close();
    await shim.close();
    client = undefined;
    shim = undefined;
    await hub.close();
  }
});

test('lowdefy mcp answers a dev tool call in a multi-app checkout with the apps to choose from', async () => {
  makeApp('apps/main');
  makeApp('apps/second');
  await connect({ cwd: root });
  const result = await client.callTool({ name: 'lowdefy_build_status', arguments: {} });
  expect(result.isError).toBe(true);
  expect(text(result)).toContain(path.join('apps', 'main'));
  expect(text(result)).toContain(path.join('apps', 'second'));
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
  const other = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shim-other-'))
  );
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
      expect.stringContaining(
        `Allow the git repository ${JSON.stringify(path.join(other, '.git'))} and its worktrees`
      ),
    ]);
    expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});

// A dev server in its own process that speaks just enough MCP to be connected
// to and list its tools, answers a tool call as an event stream that never
// ends, and says so on stdout.
const HANGING_DEV_SERVER = `
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const message = JSON.parse(body);
    if (message.id === undefined) {
      res.writeHead(202).end();
      return;
    }
    if (message.method === 'initialize') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: message.params.protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: 'dev', version: '6.0.0' },
        },
      }));
      return;
    }
    if (message.method === 'tools/list') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [] } }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.flushHeaders();
    process.stdout.write('called\\n');
  });
});
server.listen(0, '127.0.0.1', () => process.stdout.write(server.address().port + '\\n'));
`;

test('a dev tool call fails within seconds, saying the server stopped, when its dev server dies mid-call', async () => {
  const app = makeApp('.');
  const devServer = spawn(process.execPath, ['-e', HANGING_DEV_SERVER]);
  try {
    const lines = [];
    const nextLine = () =>
      new Promise((resolve) => {
        if (lines.length > 0) {
          resolve(lines.shift());
          return;
        }
        devServer.stdout.once('data', () => resolve(nextLine()));
      });
    devServer.stdout.setEncoding('utf8');
    devServer.stdout.on('data', (chunk) => lines.push(...chunk.split('\n').filter(Boolean)));
    const port = await nextLine();
    fs.mkdirSync(path.join(app, '.lowdefy'));
    fs.writeFileSync(
      path.join(app, '.lowdefy', 'instance.json'),
      JSON.stringify({
        pid: devServer.pid,
        configDirectory: app,
        owner: 'terminal',
        state: 'ready',
        url: `http://127.0.0.1:${port}`,
      })
    );
    await connect({ cwd: root });
    const pending = client.callTool({ name: 'lowdefy_build_status', arguments: {} });
    expect(await nextLine()).toEqual('called');
    const killedAt = Date.now();
    devServer.kill('SIGKILL');
    const result = await pending;
    expect(Date.now() - killedAt).toBeLessThan(10000);
    expect(result.isError).toBe(true);
    expect(text(result)).toEqual(
      `${path.basename(
        root
      )}: the dev server stopped or dropped the connection before lowdefy_build_status answered, so the call may have run in part. Call lowdefy_dev_status, then lowdefy_dev_start if it is not ready, and try again.`
    );
  } finally {
    devServer.kill('SIGKILL');
  }
});

test('lowdefy mcp refuses an app whose dependencies are not installed before it asks the hub for anything', async () => {
  const app = makeApp('.');
  fs.writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify({ devDependencies: { lowdefy: '7.1.0' } })
  );
  fs.writeFileSync(path.join(app, 'pnpm-lock.yaml'), '');
  await connect({ cwd: root });

  const start = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });
  expect(start.isError).toBe(true);
  expect(text(start)).toContain(
    `Run \`pnpm install\` in ${root}, then start the dev server again.`
  );
  const forwarded = await client.callTool({ name: 'lowdefy_build_status', arguments: {} });
  expect(forwarded.isError).toBe(true);
  expect(text(forwarded)).toContain('are not installed');
  // The hub was neither started nor attached to.
  expect(fs.existsSync(path.join(home, 'hub'))).toBe(false);
});

// A dev server's MCP endpoint, stateless, reporting the version and tools given.
async function startFakeDevServer({ version = '7.1.0', tools, failListTools = false }) {
  const httpServer = http.createServer(async (req, res) => {
    const server = new Server({ name: 'lowdefy', version }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, () => {
      if (failListTools) {
        throw new Error('listTools failed.');
      }
      return { tools };
    });
    server.setRequestHandler(CallToolRequestSchema, (request) => ({
      content: [{ type: 'text', text: `${request.params.name} answered` }],
    }));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  return httpServer;
}

async function stopFakeDevServer(devServer) {
  // The shim holds the push stream open until it closes.
  devServer.closeAllConnections();
  await new Promise((resolve) => devServer.close(resolve));
}

function fakeTool(name, { description = `${name}.`, properties = {} } = {}) {
  return { name, description, inputSchema: { type: 'object', properties } };
}

function writeInstance({ app, devServer, owner = 'terminal' }) {
  fs.mkdirSync(path.join(app, '.lowdefy'), { recursive: true });
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({
      pid: process.pid,
      configDirectory: app,
      owner,
      state: 'ready',
      url: `http://127.0.0.1:${devServer.address().port}`,
    })
  );
}

function countListChanged() {
  const counter = { count: 0 };
  client.setNotificationHandler(ToolListChangedNotificationSchema, () => {
    counter.count += 1;
  });
  return counter;
}

async function listedTool(name) {
  const { tools } = await client.listTools();
  return tools.find((tool) => tool.name === name);
}

// A stand-in hub on the hub socket: it starts nothing, and reports the app
// ready with the instance record written for the fake dev server.
async function listenAsHub({ app, devServer }) {
  const { hubDirectory, socketPath } = getHubPaths();
  fs.mkdirSync(hubDirectory, { recursive: true });
  const methods = [];
  const sockets = [];
  const hubServer = net.createServer((socket) => {
    sockets.push(socket);
    socket.setEncoding('utf8');
    socket.on(
      'data',
      createLineReader({
        onMessage: ({ id, method }) => {
          methods.push(method);
          let result = {};
          if (method === 'hello') {
            result = { protocol: HUB_PROTOCOL, pid: 1, version: '6.0.0' };
          }
          if (method === 'start') {
            writeInstance({ app, devServer, owner: 'hub' });
            result = { configDirectory: app, state: 'ready', owner: 'hub' };
          }
          socket.write(`${JSON.stringify({ id, result })}\n`);
        },
      })
    );
  });
  await new Promise((resolve) => hubServer.listen(socketPath, resolve));
  return {
    methods,
    close: async () => {
      sockets.forEach((socket) => socket.destroy());
      await new Promise((resolve) => hubServer.close(resolve));
    },
  };
}

test('lowdefy mcp learns a dev server tools when lowdefy_dev_start finds it running, with no forwarded call', async () => {
  const devServer = await startFakeDevServer({
    tools: [fakeTool('lowdefy_build_status'), fakeTool('lowdefy_newer_tool')],
  });
  try {
    const app = makeApp('.');
    writeInstance({ app, devServer });
    await connect({ cwd: root });
    const listChanged = countListChanged();
    expect(await listedTool('lowdefy_newer_tool')).toBeUndefined();

    const started = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });
    expect(started.isError).toBeUndefined();

    const added = await listedTool('lowdefy_newer_tool');
    expect(added.inputSchema.properties.directory.type).toEqual('string');
    expect(listChanged.count).toEqual(1);
    const result = await client.callTool({ name: 'lowdefy_newer_tool', arguments: {} });
    expect(text(result)).toContain('lowdefy_newer_tool answered');
  } finally {
    await stopFakeDevServer(devServer);
  }
});

test('lowdefy mcp learns a dev server tools as soon as the hub reports it ready', async () => {
  const devServer = await startFakeDevServer({
    tools: [fakeTool('lowdefy_build_status'), fakeTool('lowdefy_newer_tool')],
  });
  const app = makeApp('.');
  const hub = await listenAsHub({ app, devServer });
  try {
    await connect({ cwd: root });
    const listChanged = countListChanged();

    const started = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });
    expect(started.isError).toBeUndefined();

    expect(hub.methods).toContain('start');
    expect(await listedTool('lowdefy_newer_tool')).toBeDefined();
    expect(listChanged.count).toEqual(1);
  } finally {
    await client.close();
    await shim.close();
    await hub.close();
    await stopFakeDevServer(devServer);
  }
});

test('lowdefy mcp takes a shared tool definition from a dev server newer than the shim', async () => {
  const devServer = await startFakeDevServer({
    version: '7.1.0',
    tools: [
      fakeTool('lowdefy_build_status', {
        description: 'Build status, newer.',
        properties: { wait: { type: 'boolean' } },
      }),
    ],
  });
  try {
    writeInstance({ app: makeApp('.'), devServer });
    await connect({ cwd: root });
    const listChanged = countListChanged();

    await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

    const tool = await listedTool('lowdefy_build_status');
    expect(tool.description).toEqual('Build status, newer.');
    expect(tool.inputSchema.properties.wait.type).toEqual('boolean');
    expect(tool.inputSchema.properties.directory.type).toEqual('string');
    expect(listChanged.count).toEqual(1);
  } finally {
    await stopFakeDevServer(devServer);
  }
});

test.each([['5.2.0'], ['1.0.0'], ['6.0.0'], ['not-a-version']])(
  'lowdefy mcp keeps its own shared tool definition for a dev server reporting %s',
  async (version) => {
    const devServer = await startFakeDevServer({
      version,
      tools: [
        fakeTool('lowdefy_build_status', {
          description: 'Build status, older.',
          properties: { wait: { type: 'boolean' } },
        }),
      ],
    });
    try {
      writeInstance({ app: makeApp('.'), devServer });
      await connect({ cwd: root });
      const listChanged = countListChanged();

      await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

      const tool = await listedTool('lowdefy_build_status');
      expect(tool.description).toEqual('Build status.');
      expect(tool.inputSchema.properties.wait).toBeUndefined();
      expect(listChanged.count).toEqual(0);
    } finally {
      await stopFakeDevServer(devServer);
    }
  }
);

const EXPERIMENTAL = '0.0.0-experimental-20261002122353';

test.each([['1.0.0'], ['6.1.0']])(
  'lowdefy mcp on an experimental build keeps its shared tool definitions for a dev server reporting %s, and still adds tools it lacks',
  async (version) => {
    const devServer = await startFakeDevServer({
      version,
      tools: [
        fakeTool('lowdefy_build_status', {
          description: 'Build status, other line.',
          properties: { wait: { type: 'boolean' } },
        }),
        fakeTool('lowdefy_newer_tool'),
      ],
    });
    try {
      writeInstance({ app: makeApp('.'), devServer });
      await connect({ cwd: root, cliVersion: EXPERIMENTAL });
      const listChanged = countListChanged();

      await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

      const tool = await listedTool('lowdefy_build_status');
      expect(tool.description).toEqual('Build status.');
      expect(tool.inputSchema.properties.wait).toBeUndefined();
      expect(await listedTool('lowdefy_newer_tool')).toBeDefined();
      expect(listChanged.count).toEqual(1);
    } finally {
      await stopFakeDevServer(devServer);
    }
  }
);

test.each([['1.0.0'], ['6.1.0']])(
  'lowdefy mcp on an experimental build sends no list change for a dev server reporting %s with only shared tools',
  async (version) => {
    const devServer = await startFakeDevServer({
      version,
      tools: [fakeTool('lowdefy_build_status', { description: 'Build status, other line.' })],
    });
    try {
      writeInstance({ app: makeApp('.'), devServer });
      await connect({ cwd: root, cliVersion: EXPERIMENTAL });
      const listChanged = countListChanged();

      await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

      expect((await listedTool('lowdefy_build_status')).description).toEqual('Build status.');
      expect(listChanged.count).toEqual(0);
    } finally {
      await stopFakeDevServer(devServer);
    }
  }
);

test('lowdefy mcp on an experimental build takes a shared tool definition from a newer experimental dev server', async () => {
  const devServer = await startFakeDevServer({
    version: '0.0.0-experimental-20261003000000',
    tools: [
      fakeTool('lowdefy_build_status', {
        description: 'Build status, newer.',
        properties: { wait: { type: 'boolean' } },
      }),
    ],
  });
  try {
    writeInstance({ app: makeApp('.'), devServer });
    await connect({ cwd: root, cliVersion: EXPERIMENTAL });
    const listChanged = countListChanged();

    await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

    const tool = await listedTool('lowdefy_build_status');
    expect(tool.description).toEqual('Build status, newer.');
    expect(tool.inputSchema.properties.wait.type).toEqual('boolean');
    expect(listChanged.count).toEqual(1);
  } finally {
    await stopFakeDevServer(devServer);
  }
});

test('lowdefy mcp leaves its tool list as it was when a dev server fails to list its tools', async () => {
  const devServer = await startFakeDevServer({
    tools: [fakeTool('lowdefy_newer_tool')],
    failListTools: true,
  });
  try {
    writeInstance({ app: makeApp('.'), devServer });
    await connect({ cwd: root });
    const before = (await client.listTools()).tools;

    const started = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

    expect(started.isError).toBeUndefined();
    expect(JSON.parse(text(started)).state).toEqual('ready');
    expect((await client.listTools()).tools).toEqual(before);
  } finally {
    await stopFakeDevServer(devServer);
  }
});

test('lowdefy mcp still starts when it cannot connect to the dev server to learn its tools', async () => {
  const app = makeApp('.');
  fs.mkdirSync(path.join(app, '.lowdefy'));
  fs.writeFileSync(
    path.join(app, '.lowdefy', 'instance.json'),
    JSON.stringify({
      pid: process.pid,
      configDirectory: app,
      owner: 'terminal',
      state: 'ready',
      // Nothing listens on port 9 (discard) here.
      url: 'http://127.0.0.1:9',
    })
  );
  await connect({ cwd: root });

  const started = await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

  expect(started.isError).toBeUndefined();
});

test('lowdefy mcp ignores a dev server tool named like one of its lifecycle tools', async () => {
  const devServer = await startFakeDevServer({
    version: '9.0.0',
    tools: [fakeTool('lowdefy_dev_start', { description: 'Impostor.' })],
  });
  try {
    writeInstance({ app: makeApp('.'), devServer });
    await connect({ cwd: root });

    await client.callTool({ name: 'lowdefy_dev_start', arguments: {} });

    const { tools } = await client.listTools();
    const starts = tools.filter((tool) => tool.name === 'lowdefy_dev_start');
    expect(starts).toHaveLength(1);
    expect(starts[0].description).not.toEqual('Impostor.');
  } finally {
    await stopFakeDevServer(devServer);
  }
});

test('lowdefy mcp adds the tools a newer dev server has on the first forwarded call', async () => {
  const devServer = await startFakeDevServer({
    tools: [fakeTool('lowdefy_build_status'), fakeTool('lowdefy_newer_tool')],
  });
  try {
    writeInstance({ app: makeApp('.'), devServer });
    await connect({ cwd: root });
    const listChanged = countListChanged();

    await client.callTool({ name: 'lowdefy_build_status', arguments: {} });

    expect(await listedTool('lowdefy_newer_tool')).toBeDefined();
    expect(listChanged.count).toEqual(1);
  } finally {
    await stopFakeDevServer(devServer);
  }
});
