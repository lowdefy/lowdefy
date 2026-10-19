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

import fetchOpenTabs from './fetchOpenTabs.js';

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

test('fetchOpenTabs counts no tabs when the dev server does not answer in time', async () => {
  await expect(fetchOpenTabs({ url, timeoutMs: 100 })).resolves.toEqual(0);
});

test('fetchOpenTabs marks its poll passive, so it never keeps an idle server alive', async () => {
  let passive;
  const answering = http.createServer((req, res) => {
    passive = req.headers['x-lowdefy-passive'];
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ tabs: [{ id: 'a' }, { id: 'b' }] }));
  });
  await new Promise((resolve) => answering.listen(0, '127.0.0.1', resolve));
  try {
    await expect(
      fetchOpenTabs({ url: `http://127.0.0.1:${answering.address().port}` })
    ).resolves.toEqual(2);
    expect(passive).toEqual('1');
  } finally {
    answering.closeAllConnections();
    await new Promise((resolve) => answering.close(resolve));
  }
});
