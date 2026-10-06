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

const { listTabs, registerTab, requestFromTab, unregisterTab, updateTabPage } = await import(
  '../../lib/docs/tabChannel.js'
);
const { default: devInspectHandler } = await import('./devInspect.js');

function createApp() {
  const app = new Hono();
  app.all('/api/dev-inspect', devInspectHandler);
  app.all('/api/dev-inspect/*', devInspectHandler);
  return app;
}

const sameOriginHeaders = {
  host: 'localhost:3001',
  origin: 'http://localhost:3001',
  'content-type': 'application/json',
};

// tabChannel keeps its registries at module scope, so clear connected tabs
// between tests to keep them independent.
afterEach(() => {
  listTabs().forEach((tab) => unregisterTab({ id: tab.id }));
});

function connectTab({ id, pageId, send = jest.fn() }) {
  registerTab({ id, send });
  updateTabPage({ id, pageId, pathParams: {}, instanceKey: `page:${pageId}` });
}

test('GET /api/dev-inspect lists connected tabs', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const res = await createApp().request('/api/dev-inspect');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.tabs).toHaveLength(1);
  expect(body.tabs[0]).toMatchObject({ id: 'tab-1', pageId: 'home' });
});

test('POST /api/dev-inspect/page returns 403 when the Origin header is missing', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: { host: 'localhost:3001', 'content-type': 'application/json' },
    body: JSON.stringify({ tabId: 'tab-1', pageId: 'about' }),
  });
  expect(res.status).toBe(403);
  expect(listTabs()[0].pageId).toBe('home');
});

test('POST /api/dev-inspect/page moves a connected tab to the posted page', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ tabId: 'tab-1', pageId: 'about', instanceKey: 'page:about' }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
  expect(listTabs()[0].pageId).toBe('about');
});

test('POST /api/dev-inspect/page records the page instance a tab shows', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({
      tabId: 'tab-1',
      pageId: 'ticket',
      pathParams: { space: 's', ticket_id: '2' },
      instanceKey: 'page:ticket#tickets/s/2',
    }),
  });
  expect(res.status).toBe(200);
  expect(listTabs()[0]).toMatchObject({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '2' },
    instanceKey: 'page:ticket#tickets/s/2',
  });
});

test('POST /api/dev-inspect/page returns 400 when the instance key is missing', async () => {
  connectTab({ id: 'tab-1', pageId: 'home' });
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ tabId: 'tab-1', pageId: 'about' }),
  });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: 'Missing "pageId" or "instanceKey".' });
  expect(listTabs()[0].pageId).toBe('home');
});

test('POST /api/dev-inspect/page returns 400 when tabId is missing', async () => {
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ pageId: 'about' }),
  });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: 'Missing "tabId".' });
});

test('POST /api/dev-inspect/page for a tab that already disconnected returns ok', async () => {
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ tabId: 'gone', pageId: 'about', instanceKey: 'page:about' }),
  });
  expect(res.status).toBe(200);
  expect(listTabs()).toHaveLength(0);
});

test('POST /api/dev-inspect resolves a pending tab request with the posted result', async () => {
  const send = jest.fn();
  connectTab({ id: 'tab-1', pageId: 'home', send });
  const pending = requestFromTab({ pageId: 'home', event: 'inspect-request' });
  const [, { requestId }] = send.mock.calls[0];

  const res = await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ requestId, result: { state: { a: 1 } } }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
  await expect(pending).resolves.toEqual({ state: { a: 1 } });
});

test('POST /api/dev-inspect returns 400 when requestId is missing', async () => {
  const res = await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: sameOriginHeaders,
    body: JSON.stringify({ result: {} }),
  });
  expect(res.status).toBe(400);
});
