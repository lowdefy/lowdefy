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

import http from 'http';

import createInstanceConnections from './createInstanceConnections.js';

// A dev server that accepts connections and never answers.
let server;
let url;

beforeAll(async () => {
  server = http.createServer(() => {});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('an instance connection fails when the dev server does not answer in time', async () => {
  const instances = createInstanceConnections({
    cliVersion: '6.0.0',
    onNotification: () => {},
    connectTimeoutMs: 100,
  });
  await expect(
    instances.get({ configDirectory: '/app', instance: { url, pid: 1 }, label: 'app' })
  ).rejects.toThrow('timed out');
});

test('an instance connection to a dev server with no URL yet says so', async () => {
  const instances = createInstanceConnections({ cliVersion: '6.0.0', onNotification: () => {} });
  await expect(
    instances.get({
      configDirectory: '/app',
      instance: { state: 'starting', pid: 1 },
      label: 'app',
    })
  ).rejects.toThrow('app: the dev server (state starting) has no URL yet.');
});
