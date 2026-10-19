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

import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';

const listenErrors = [];

function createServer() {
  const server = new EventEmitter();
  server.unref = () => {};
  server.close = (callback) => callback();
  server.listen = (port, host, callback) => {
    const code = listenErrors.shift();
    if (code === undefined) {
      callback();
      return;
    }
    server.emit('error', Object.assign(new Error(`listen ${code}`), { code }));
  };
  return server;
}

jest.unstable_mockModule('node:net', () => ({ default: { createServer } }));

const { default: pickDataStorePort, MIN_PORT } = await import('./pickDataStorePort.js');

beforeEach(() => {
  listenErrors.length = 0;
});

test('pickDataStorePort tries another port when one is in use or reserved by Windows', async () => {
  listenErrors.push('EADDRINUSE', 'EACCES');
  const port = await pickDataStorePort();
  expect(port).toBeGreaterThanOrEqual(MIN_PORT);
  expect(port).toBeLessThanOrEqual(65535);
  expect(listenErrors).toEqual([]);
});

test('pickDataStorePort rejects on a listen error that is not about the port', async () => {
  listenErrors.push('EPERM');
  await expect(pickDataStorePort()).rejects.toThrow('listen EPERM');
});

test('pickDataStorePort gives up after twenty ports that cannot be taken', async () => {
  listenErrors.push(...Array(20).fill('EACCES'));
  await expect(pickDataStorePort()).rejects.toThrow(
    'No free port between 49152 and 65535 for the journey data store after 20 tries.'
  );
});
