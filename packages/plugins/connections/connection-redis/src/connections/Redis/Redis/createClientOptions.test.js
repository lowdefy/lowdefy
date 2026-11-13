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

import { expect, test } from 'vitest';

import createClientOptions from './createClientOptions.js';

test('createClientOptions turns a connection string into a url option without reconnects', () => {
  expect(createClientOptions({ connection: 'redis://localhost:6379/1' })).toEqual({
    url: 'redis://localhost:6379/1',
    socket: { reconnectStrategy: false },
  });
});

test('createClientOptions adds reconnectStrategy false to the socket options of a connection object', () => {
  expect(
    createClientOptions({
      connection: { password: 'password', socket: { host: 'host', port: 1, tls: true } },
    })
  ).toEqual({
    password: 'password',
    socket: { reconnectStrategy: false, host: 'host', port: 1, tls: true },
  });
});

test('createClientOptions keeps a reconnectStrategy the connection sets', () => {
  expect(
    createClientOptions({ connection: { socket: { host: 'host', reconnectStrategy: 1000 } } })
  ).toEqual({ socket: { host: 'host', reconnectStrategy: 1000 } });
});

test('createClientOptions does not mutate the connection config', () => {
  const connection = { url: 'redis://localhost:6379', socket: { connectTimeout: 1000 } };
  createClientOptions({ connection });
  expect(connection).toEqual({ url: 'redis://localhost:6379', socket: { connectTimeout: 1000 } });
});
