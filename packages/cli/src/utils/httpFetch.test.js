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

import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';

import httpFetch from './httpFetch.js';
import readResponseBody from './readResponseBody.js';

let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
      return;
    }
    if (req.url === '/missing') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    if (req.url === '/broken') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end('{"error":"broken"}');
      return;
    }
    if (req.url === '/echo') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: req.method, type: req.headers['content-type'], body }));
      });
      return;
    }
    if (req.url === '/slow-headers') {
      setTimeout(() => res.end('late'), 500);
      return;
    }
    if (req.url === '/slow-body') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('first ');
      setTimeout(() => res.end('last'), 500);
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('httpFetch resolves a 2xx response with its body', async () => {
  const response = await httpFetch({ url: `${baseUrl}/json` });
  expect(response.ok).toBe(true);
  expect(await response.json()).toEqual({ ok: true });
});

test('httpFetch resolves a 404 rather than throwing', async () => {
  const response = await httpFetch({ url: `${baseUrl}/missing` });
  expect(response.ok).toBe(false);
  expect(response.status).toBe(404);
  expect(await readResponseBody(response)).toBe('Not found');
});

test('httpFetch resolves a non-2xx response rather than throwing', async () => {
  const response = await httpFetch({ url: `${baseUrl}/broken` });
  expect(response.ok).toBe(false);
  expect(response.status).toBe(500);
  expect(await readResponseBody(response)).toEqual({ error: 'broken' });
});

test('httpFetch passes the method, headers and body to fetch', async () => {
  const response = await httpFetch({
    url: `${baseUrl}/echo`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: 1 }),
  });
  expect(await response.json()).toEqual({
    method: 'POST',
    type: 'application/json',
    body: '{"a":1}',
  });
});

test('httpFetch throws a timeout before the response arrives', async () => {
  await expect(httpFetch({ url: `${baseUrl}/slow-headers`, timeoutMs: 100 })).rejects.toThrow(
    'timeout of 100ms exceeded'
  );
});

test('httpFetch times out while the body is still being read', async () => {
  const response = await httpFetch({ url: `${baseUrl}/slow-body`, timeoutMs: 100 });
  await expect(response.text()).rejects.toThrow(expect.objectContaining({ name: 'TimeoutError' }));
});

test('httpFetch sets no timeout when timeoutMs is 0', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const response = await httpFetch({ url: `${baseUrl}/slow-body`, timeoutMs: 0 });
  expect(await response.text()).toBe('first last');
  expect(timeout).not.toHaveBeenCalled();
});

test('httpFetch sets a 5 second timeout by default', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  await httpFetch({ url: `${baseUrl}/json` });
  expect(timeout).toHaveBeenCalledWith(5000);
});

test('httpFetch aborts on the caller signal', async () => {
  const controller = new AbortController();
  const pending = httpFetch({ url: `${baseUrl}/slow-headers`, signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toThrow(expect.objectContaining({ name: 'AbortError' }));
});

test('httpFetch throws the network failure reason, not "fetch failed"', async () => {
  const closed = http.createServer();
  await new Promise((resolve) => closed.listen(0, '127.0.0.1', resolve));
  const { port } = closed.address();
  await new Promise((resolve) => closed.close(resolve));
  await expect(httpFetch({ url: `http://127.0.0.1:${port}/` })).rejects.toThrow(
    `connect ECONNREFUSED 127.0.0.1:${port}`
  );
});
