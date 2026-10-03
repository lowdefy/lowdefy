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
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';

import connectHub from './connectHub.js';
import createLineReader from './createLineReader.js';
import getHubPaths from './getHubPaths.js';
import { HUB_PROTOCOL } from './hubProtocol.js';

const originalHome = process.env.LOWDEFY_HOME;
let home;
let server;
let sockets;

// A stand-in hub on the socket path, answering hello.
async function listenAsHub(socketPath) {
  server = net.createServer((socket) => {
    sockets.push(socket);
    socket.setEncoding('utf8');
    socket.on(
      'data',
      createLineReader({
        onMessage: ({ id }) =>
          socket.write(`${JSON.stringify({ id, result: { protocol: HUB_PROTOCOL, pid: 1 } })}\n`),
      })
    );
  });
  await new Promise((resolve) => server.listen(socketPath, resolve));
}

beforeEach(() => {
  sockets = [];
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-connect-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(async () => {
  jest.restoreAllMocks();
  sockets.forEach((socket) => socket.destroy());
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  server = null;
  if (originalHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = originalHome;
  }
  fs.rmSync(home, { recursive: true, force: true });
});

// Socket ownership is a uid check. Windows has no uids, and its named pipe
// takes the user's default access instead.
const onPosix = process.platform === 'win32' ? test.skip : test;

test('connectHub connects to a hub socket of its own user', async () => {
  const { hubDirectory, socketPath } = getHubPaths();
  fs.mkdirSync(hubDirectory, { recursive: true });
  await listenAsHub(socketPath);
  const client = await connectHub({ autoStart: false });
  expect(client).not.toBeNull();
  client.close();
});

onPosix('connectHub refuses a hub socket that belongs to another user', async () => {
  const { hubDirectory, socketPath } = getHubPaths();
  fs.mkdirSync(hubDirectory, { recursive: true });
  await listenAsHub(socketPath);
  jest.spyOn(process, 'getuid').mockReturnValue(process.getuid() + 1);
  await expect(connectHub({ autoStart: false })).rejects.toThrow('belongs to another user');
});
