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

import { afterAll, beforeAll, expect, test } from 'vitest';

import AxiosHttp from './AxiosHttp.js';

// A slow upstream: it answers 5s after a request arrives, unless the caller hangs up first.
let server;
let url;
let open;
let closedEarly;

beforeAll(async () => {
  open = 0;
  closedEarly = 0;
  server = http.createServer((req, res) => {
    open += 1;
    const timer = setTimeout(() => res.end('late'), 5000);
    res.on('close', () => {
      open -= 1;
      if (!res.writableFinished) {
        clearTimeout(timer);
        closedEarly += 1;
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/slow`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function waitFor(check, { timeoutMs = 2000 } = {}) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}

test('a call still waiting when the request times out is aborted', async () => {
  const controller = new AbortController();
  const before = closedEarly;
  const pending = AxiosHttp({
    request: { url },
    connection: { allowInternalAddresses: true },
    signal: controller.signal,
  }).catch((error) => error);
  expect(await waitFor(() => open === 1)).toBe(true);
  const abortedAt = Date.now();
  controller.abort(new DOMException('The request timeout of 300ms was exceeded.', 'TimeoutError'));
  const error = await pending;
  expect(error.name).toBe('CanceledError');
  expect(error.code).toBe('ERR_CANCELED');
  expect(Date.now() - abortedAt).toBeLessThan(1000);
  // The upstream sees the connection close, long before it would have answered.
  expect(await waitFor(() => closedEarly === before + 1)).toBe(true);
});

test('a timeout the request sets still applies alongside the signal', async () => {
  const controller = new AbortController();
  const error = await AxiosHttp({
    request: { url, timeout: 100 },
    connection: { allowInternalAddresses: true },
    signal: controller.signal,
  }).catch((e) => e);
  expect(error.code).toBe('ECONNABORTED');
  expect(controller.signal.aborted).toBe(false);
});

test('a call with no signal runs as before', async () => {
  const error = await AxiosHttp({
    request: { url, timeout: 100 },
    connection: { allowInternalAddresses: true },
  }).catch((e) => e);
  expect(error.code).toBe('ECONNABORTED');
});
