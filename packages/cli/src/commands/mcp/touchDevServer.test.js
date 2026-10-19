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

import touchDevServer from './touchDevServer.js';

async function listen(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/base` };
}

test('touchDevServer makes one request the dev manager counts as use, not a passive one', async () => {
  const requests = [];
  const { server, url } = await listen((req, res) => {
    requests.push({ url: req.url, passive: req.headers['x-lowdefy-passive'] });
    res.end('ok');
  });
  try {
    await touchDevServer({ url });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  expect(requests).toEqual([{ url: '/base/api/ping', passive: undefined }]);
});

test('touchDevServer resolves when the server does not answer', async () => {
  const { server, url } = await listen(() => {});
  try {
    await expect(touchDevServer({ url, timeoutMs: 50 })).resolves.toBeUndefined();
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
