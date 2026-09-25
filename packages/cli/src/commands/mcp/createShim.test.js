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
import os from 'os';
import path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

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

async function connect({ cwd }) {
  shim = createShim({ cliVersion: '6.0.0', cwd, devTools });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await shim.server.connect(serverTransport);
  client = new Client({ name: 'test', version: '1.0.0' });
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
    'lowdefy_dev_list',
    'lowdefy_build_status',
  ]);
  const buildStatus = tools.find((tool) => tool.name === 'lowdefy_build_status');
  expect(buildStatus.inputSchema.properties.directory.type).toEqual('string');
  expect(client.getInstructions()).toContain('never run `lowdefy dev` yourself');
  expect(client.getInstructions()).toContain('Dev server instructions.');
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
