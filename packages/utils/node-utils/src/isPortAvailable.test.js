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

import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

let listenErrors;

jest.unstable_mockModule('net', () => ({
  default: {
    createServer: () => {
      const server = new EventEmitter();
      server.listen = (port, host, callback) => {
        const code = listenErrors[host ?? 'wildcard'];
        if (code === undefined) {
          callback();
          return;
        }
        const error = new Error(`listen ${code}`);
        error.code = code;
        setImmediate(() => server.emit('error', error));
      };
      server.close = (callback) => callback();
      return server;
    },
  },
}));

const { default: isPortAvailable } = await import('./isPortAvailable.js');

beforeEach(() => {
  listenErrors = {};
});

test('isPortAvailable returns true when every host binds', async () => {
  expect(await isPortAvailable({ port: 4100 })).toBe(true);
});

test('isPortAvailable returns false when a host reports the port in use', async () => {
  listenErrors = { '127.0.0.1': 'EADDRINUSE' };
  expect(await isPortAvailable({ port: 4100 })).toBe(false);
});

test('isPortAvailable returns false when the port may not be bound, as in a Windows excluded port range', async () => {
  listenErrors = { wildcard: 'EACCES' };
  expect(await isPortAvailable({ port: 49740 })).toBe(false);
});

test('isPortAvailable returns true when the host has no IPv6 loopback', async () => {
  listenErrors = { '::1': 'EADDRNOTAVAIL' };
  expect(await isPortAvailable({ port: 4100 })).toBe(true);
});

test('isPortAvailable rethrows an unexpected listen error', async () => {
  listenErrors = { wildcard: 'EMFILE' };
  await expect(isPortAvailable({ port: 4100 })).rejects.toThrow('listen EMFILE');
});
