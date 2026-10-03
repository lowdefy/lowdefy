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

import listenHubSocket from './listenHubSocket.js';

let directory;
let server;
let umask;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-socket-'));
  umask = process.umask(0);
});

afterEach(async () => {
  process.umask(umask);
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(directory, { recursive: true, force: true });
});

// A Unix socket file with mode bits. On Windows the hub listens on a named pipe,
// which has neither.
const onPosix = process.platform === 'win32' ? test.skip : test;

onPosix('listenHubSocket creates the socket for its user only, whatever the umask', async () => {
  const socketPath = path.join(directory, 'hub.sock');
  let modeWhenListening;
  server = net.createServer();
  server.once('listening', () => {
    modeWhenListening = fs.statSync(socketPath).mode & 0o777;
  });
  const listening = await listenHubSocket({
    server,
    socketPath,
    lockPath: path.join(directory, 'start.lock'),
  });
  expect(listening).toBe(true);
  expect(modeWhenListening & 0o077).toEqual(0);
  expect(process.umask()).toEqual(0);
});
