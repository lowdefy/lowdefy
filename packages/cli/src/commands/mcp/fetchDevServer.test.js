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

import fetchDevServer, { DROPPED_MESSAGE } from './fetchDevServer.js';

// Each test sets how the fake dev server answers a request.
let respond;
let server;
let url;

beforeAll(async () => {
  server = http.createServer((req, res) => respond(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

function toolCall(id) {
  return {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'x' } }),
  };
}

function openEventStream(res) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  res.flushHeaders();
}

test('fetchDevServer passes an answered event stream through unchanged', async () => {
  const answer = `event: message\ndata: ${JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    result: {},
  })}\n\n`;
  respond = (req, res) => {
    openEventStream(res);
    res.end(answer);
  };
  const response = await fetchDevServer(url, toolCall(3));
  expect(await response.text()).toEqual(answer);
});

test('fetchDevServer answers a tool call whose stream breaks before the answer', async () => {
  respond = (req, res) => {
    openEventStream(res);
    res.write('event: message\ndata: {"jsonrpc":"2.0","method":"notifications/progress"}\n\n');
    setTimeout(() => res.destroy(), 50);
  };
  const response = await fetchDevServer(url, toolCall(4));
  const text = await response.text();
  const lastData = text.trim().split('\n').pop().slice('data: '.length);
  expect(JSON.parse(lastData)).toEqual({
    jsonrpc: '2.0',
    id: 4,
    error: { code: -32000, message: DROPPED_MESSAGE },
  });
});

test('fetchDevServer answers a tool call whose stream ends cleanly without the answer', async () => {
  respond = (req, res) => {
    openEventStream(res);
    // An answer to another request does not count.
    res.end(`data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} })}\n\n`);
  };
  const response = await fetchDevServer(url, toolCall(5));
  expect(await response.text()).toContain(`"id":5,"error":{"code":-32000`);
});

test('fetchDevServer leaves the push stream and notifications alone', async () => {
  respond = (req, res) => {
    openEventStream(res);
    res.end('event: ping\ndata: \n\n');
  };
  const push = await fetchDevServer(url, { method: 'GET' });
  expect(await push.text()).toEqual('event: ping\ndata: \n\n');
  const notification = await fetchDevServer(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  expect(await notification.text()).toEqual('event: ping\ndata: \n\n');
});
