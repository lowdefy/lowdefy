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

import { Hono } from 'hono';
import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// A real McpServer with the logging capability rides the real @hono/mcp
// transport, so the test covers the actual notification path; only the docs
// tool registrations and the bus subscription are stubbed out.
const mockSubscribeMcpServerToDevEvents = jest.fn();
const mockUnsubscribe = jest.fn();
jest.unstable_mockModule('../../../lib/docs/createDocsMcpServer.js', () => ({
  default: () =>
    new McpServer(
      { name: 'lowdefy-docs-test', version: '1.0.0' },
      { capabilities: { logging: {} } }
    ),
  subscribeMcpServerToDevEvents: mockSubscribeMcpServerToDevEvents,
}));
jest.unstable_mockModule('../../../lib/docs/devEventBus.js', () => ({
  bootedAt: '2026-05-06T07:08:09.000Z',
}));

const { default: docsMcpHandler } = await import('./mcp.js');

function createApp() {
  const app = new Hono();
  app.all('/lowdefy-docs/mcp', docsMcpHandler);
  return app;
}

async function readFirstFrame(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (!buffer.includes('\n\n')) {
    const { value, done } = await reader.read();
    if (done) throw new Error('Stream closed before a full frame arrived.');
    buffer += decoder.decode(value, { stream: true });
  }
  const frame = buffer.slice(0, buffer.indexOf('\n\n'));
  const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
  return JSON.parse(dataLine.slice('data:'.length));
}

beforeEach(() => {
  mockSubscribeMcpServerToDevEvents.mockReturnValue(mockUnsubscribe);
});

test('GET /lowdefy-docs/mcp subscribes to dev events and pushes the restart notification first', async () => {
  const controller = new AbortController();
  const res = await createApp().request('/lowdefy-docs/mcp', {
    headers: { accept: 'text/event-stream' },
    signal: controller.signal,
  });

  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toContain('text/event-stream');
  expect(mockSubscribeMcpServerToDevEvents).toHaveBeenCalledTimes(1);
  const [server] = mockSubscribeMcpServerToDevEvents.mock.calls[0];
  expect(server).toBeInstanceOf(McpServer);

  const message = await readFirstFrame(res);
  expect(message).toEqual({
    jsonrpc: '2.0',
    method: 'notifications/message',
    params: {
      level: 'info',
      logger: 'lowdefy',
      data: {
        type: 'restart',
        timestamp: expect.any(String),
        bootedAt: '2026-05-06T07:08:09.000Z',
      },
    },
  });
  controller.abort();
});

test('aborting the GET stream unsubscribes from dev events', async () => {
  const controller = new AbortController();
  const res = await createApp().request('/lowdefy-docs/mcp', {
    headers: { accept: 'text/event-stream' },
    signal: controller.signal,
  });
  await readFirstFrame(res);
  expect(mockUnsubscribe).not.toHaveBeenCalled();

  controller.abort();
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(mockUnsubscribe).toHaveBeenCalled();
});

test('POST /lowdefy-docs/mcp stays stateless and does not subscribe to dev events', async () => {
  const res = await createApp().request('/lowdefy-docs/mcp', {
    method: 'POST',
    headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    }),
  });

  expect(res.status).toBe(200);
  expect(res.headers.get('mcp-session-id')).toBeNull();
  expect(mockSubscribeMcpServerToDevEvents).not.toHaveBeenCalled();
  const message = await readFirstFrame(res);
  expect(message.result.capabilities).toEqual({ logging: {} });
});

test('a GET subscriber that never closes is pruned once the stream cap is reached', async () => {
  // The transport's send returns silently when no stream is open, so the bus
  // never learns about a stream that died without onclose or abort. Every
  // reconnect would otherwise add another subscribed McpServer.
  const app = createApp();
  const controllers = [];
  for (let i = 0; i < 5; i++) {
    const controller = new AbortController();
    controllers.push(controller);
    const res = await app.request('/lowdefy-docs/mcp', {
      headers: { accept: 'text/event-stream' },
      signal: controller.signal,
    });
    await readFirstFrame(res);
  }

  expect(mockSubscribeMcpServerToDevEvents).toHaveBeenCalledTimes(5);
  // Four streams are held; the fifth connection evicted the oldest.
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  controllers.forEach((controller) => controller.abort());
});
