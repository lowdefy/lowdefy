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
import { EventEmitter } from 'node:events';

import { Hono } from 'hono';
import { vi, afterEach, expect, test } from 'vitest';

const watchers = [];

vi.doMock('chokidar', () => ({
  default: {
    watch: vi.fn((paths) => {
      const watcher = new EventEmitter();
      watcher.paths = paths;
      watcher.close = vi.fn(async () => {});
      watchers.push(watcher);
      return watcher;
    }),
  },
}));

const { default: reloadHandler } = await import('./reload.js');
const { listTabs } = await import('../../lib/docs/tabChannel.js');
const { closePolledTabs } = await import('../../lib/docs/pollTab.js');

const app = new Hono();
app.get('/api/reload', reloadHandler);

function poll({ query, headers }) {
  return app.request(`/api/reload?transport=poll&${query}`, { headers });
}

afterEach(() => {
  closePolledTabs();
});

const decoder = new TextDecoder();

// Reads SSE frames off a stream until one with the given event arrives.
async function readEvent(connection, event) {
  for (;;) {
    const frameEnd = connection.buffer.indexOf('\n\n');
    if (frameEnd !== -1) {
      const frame = connection.buffer.slice(0, frameEnd);
      connection.buffer = connection.buffer.slice(frameEnd + 2);
      if (frame.includes(`event: ${event}\n`)) {
        return frame;
      }
      continue;
    }
    const { value, done } = await connection.reader.read();
    if (done) {
      throw new Error(`Stream ended before a ${event} event.`);
    }
    connection.buffer += decoder.decode(value, { stream: true });
  }
}

async function connect() {
  const response = await app.request('/api/reload');
  const connection = { reader: response.body.getReader(), buffer: '' };
  await readEvent(connection, 'tab');
  return connection;
}

function countEvents(connection, event) {
  return connection.buffer.split('\n\n').filter((frame) => frame.includes(`event: ${event}\n`))
    .length;
}

test('reload streams share one watcher, each gets a reload once, and the last to close closes it', async () => {
  const connections = [await connect(), await connect(), await connect()];
  expect(watchers).toHaveLength(1);
  expect(watchers[0].paths).toEqual(['./build/reload']);
  expect(listTabs()).toHaveLength(3);

  watchers[0].emit('change', './build/reload');
  for (const connection of connections) {
    await readEvent(connection, 'reload');
  }
  // Give a duplicate frame the chance to arrive before counting.
  await new Promise((resolve) => setImmediate(resolve));
  connections.forEach((connection) => expect(countEvents(connection, 'reload')).toBe(0));

  // No reload on unlink: a skeleton rebuild removes build/reload before it publishes.
  watchers[0].emit('unlink', './build/reload');

  await connections[0].reader.cancel();
  await connections[1].reader.cancel();
  await new Promise((resolve) => setImmediate(resolve));
  expect(watchers[0].close).not.toHaveBeenCalled();

  await connections[2].reader.cancel();
  await vi.waitFor(() => expect(watchers[0].close).toHaveBeenCalledTimes(1));
  expect(listTabs()).toHaveLength(0);

  // A tab opened after every stream closed starts a new watcher.
  const next = await connect();
  expect(watchers).toHaveLength(2);
  await next.reader.cancel();
  await vi.waitFor(() => expect(watchers[1].close).toHaveBeenCalledTimes(1));
});

test('a phone shell registers as a device tab with its shell version, platform and app id', async () => {
  const res = await poll({
    query: 'client=lowdefy-dev-tab-client&platform=ios&app=com.lowdefy.dev',
    headers: { 'x-lowdefy-shell': '7.1.0' },
  });
  expect(res.status).toBe(200);
  const { tabId } = await res.json();
  expect(listTabs()).toEqual([
    expect.objectContaining({
      id: tabId,
      device: { shell: '7.1.0', platform: 'ios', app: 'com.lowdefy.dev', paired: false },
    }),
  ]);
});

test('a phone paired over the network is marked paired', async () => {
  await poll({
    query: 'platform=android',
    headers: { 'x-lowdefy-shell': '7.1.0', 'x-lowdefy-dev-remote': '1' },
  });
  expect(listTabs()[0].device).toEqual({
    shell: '7.1.0',
    platform: 'android',
    app: null,
    paired: true,
  });
});

test('a browser tab is no device, whatever its query says', async () => {
  await poll({ query: 'platform=ios', headers: {} });
  expect(listTabs()[0].device).toBeNull();
});

test('an unknown platform is recorded as none', async () => {
  await poll({ query: 'platform=watchos', headers: { 'x-lowdefy-shell': '7.1.0' } });
  expect(listTabs()[0].device.platform).toBeNull();
});
