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

import fs from 'fs';
import os from 'os';
import path from 'path';

import { Hono } from 'hono';

// The middleware reads build/buildStatus.json from process.cwd() via
// readBuildArtifact — point it at a throwaway server directory before import.
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-stale-mw-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'));
process.chdir(fixtureDir);

const statusPath = path.join(fixtureDir, 'build', 'buildStatus.json');

function setBuildFailed() {
  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'error', timestamp: '2026-02-03T04:05:06.000Z', errors: [] })
  );
}

function setBuildOk() {
  fs.writeFileSync(
    statusPath,
    JSON.stringify({ status: 'ok', timestamp: '2026-02-03T04:05:06.000Z', errors: [] })
  );
}

const { default: staleFlag } = await import('./staleFlag.js');

function createApp() {
  const app = new Hono();
  // Mirrors src/app.js: the MCP transport is registered BEFORE the middleware
  // so its JSON-RPC envelopes are never given extra members.
  app.post('/lowdefy-docs/mcp', (c) => c.json({ jsonrpc: '2.0', id: 1, result: {} }));
  app.use('/lowdefy-docs/*', staleFlag());
  app.get('/lowdefy-docs/object', (c) => c.json({ pageId: 'home', blocks: [] }));
  app.get('/lowdefy-docs/own-stale', (c) => c.json({ stale: false, staleSince: 'handler' }));
  app.get('/lowdefy-docs/array', (c) => c.json([{ type: 'Button' }]));
  app.get('/lowdefy-docs/markdown', (c) =>
    c.text('# Overview\n', 200, { 'Content-Type': 'text/markdown; charset=UTF-8' })
  );
  app.get('/lowdefy-docs/png', (c) =>
    c.body(new Uint8Array([1, 2, 3]), 200, { 'Content-Type': 'image/png' })
  );
  return app;
}

test('staleFlag merges the stale fields into a JSON object body when the build failed', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/object');
  const body = await res.json();
  expect(body.pageId).toEqual('home');
  expect(body.stale).toBe(true);
  expect(body.staleSince).toEqual('2026-02-03T04:05:06.000Z');
  expect(body.staleReason).toContain('The last build failed.');
  expect(res.headers.get('X-Lowdefy-Stale')).toEqual('true');
  expect(res.headers.get('X-Lowdefy-Stale-Since')).toEqual('2026-02-03T04:05:06.000Z');
});

test('staleFlag never overwrites a stale key the handler already set', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/own-stale');
  const body = await res.json();
  expect(body.stale).toBe(false);
  expect(body.staleSince).toEqual('handler');
  expect(body.staleReason).toContain('The last build failed.');
});

test('staleFlag leaves a JSON array body unchanged but still sets the headers', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/array');
  expect(await res.json()).toEqual([{ type: 'Button' }]);
  expect(res.headers.get('X-Lowdefy-Stale')).toEqual('true');
  expect(res.headers.get('X-Lowdefy-Stale-Since')).toEqual('2026-02-03T04:05:06.000Z');
});

test('staleFlag prepends a banner to a markdown body when the build failed', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/markdown');
  const body = await res.text();
  expect(body.startsWith('> STALE: The last build failed.')).toBe(true);
  expect(body).toContain('# Overview');
  expect(res.headers.get('X-Lowdefy-Stale')).toEqual('true');
});

test('staleFlag leaves other content types untouched but still sets the headers', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/png');
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(res.headers.get('X-Lowdefy-Stale')).toEqual('true');
});

test('staleFlag changes nothing when the last build succeeded', async () => {
  setBuildOk();
  const app = createApp();
  const jsonRes = await app.request('/lowdefy-docs/object');
  expect(await jsonRes.json()).toEqual({ pageId: 'home', blocks: [] });
  expect(jsonRes.headers.get('X-Lowdefy-Stale')).toBe(null);
  const markdownRes = await app.request('/lowdefy-docs/markdown');
  expect(await markdownRes.text()).toEqual('# Overview\n');
});

// MCP results carry their own STALE notice from createDocsMcpServer; a
// JSON-RPC envelope must not gain unknown top-level members.
test('staleFlag does not touch a route registered before it, such as the MCP transport', async () => {
  setBuildFailed();
  const res = await createApp().request('/lowdefy-docs/mcp', { method: 'POST' });
  expect(await res.json()).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
  expect(res.headers.get('X-Lowdefy-Stale')).toBe(null);
});
