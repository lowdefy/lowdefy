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

import http from 'node:http';

import { afterAll, beforeAll, expect, test, vi } from 'vitest';

// A test server can only listen on a loopback address, so 127.0.0.1 stands in for a public
// address here and every other address, including ::1, counts as internal.
vi.doMock('@lowdefy/node-utils/isPublicAddress.js', () => ({
  default: (address) => address === '127.0.0.1',
}));

let server;
let port;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/to-literal') {
      res.statusCode = 302;
      res.setHeader('location', `http://127.0.0.2:${port}/ok`);
      res.end();
      return;
    }
    if (req.url === '/to-metadata') {
      res.statusCode = 301;
      res.setHeader('location', 'http://169.254.169.254/latest/meta-data/');
      res.end();
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('a request to a public address goes through', async () => {
  const { default: AxiosHttp } = await import('./AxiosHttp.js');
  const res = await AxiosHttp({ request: { url: `http://127.0.0.1:${port}/ok` }, connection: {} });
  expect(res.data).toEqual({ ok: true });
});

test('a redirect to an internal IP literal is refused', async () => {
  const { default: AxiosHttp } = await import('./AxiosHttp.js');
  const error = await AxiosHttp({
    request: { url: `http://127.0.0.1:${port}/to-literal` },
    connection: {},
  }).catch((e) => e);
  expect(error.message).toMatch('AxiosHttp request to "127.0.0.2" was refused');
  expect(error.code).toBe('ERR_AXIOS_HTTP_REFUSED');
});

test('a redirect to the cloud metadata address is refused', async () => {
  const { default: AxiosHttp } = await import('./AxiosHttp.js');
  const error = await AxiosHttp({
    request: { url: `http://127.0.0.1:${port}/to-metadata` },
    connection: {},
  }).catch((e) => e);
  expect(error.message).toMatch('AxiosHttp request to "169.254.169.254" was refused');
});
