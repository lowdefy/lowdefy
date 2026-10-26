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

import { Hono } from 'hono';
import { vi, afterEach, expect, test } from 'vitest';
import { serializer } from '@lowdefy/helpers';

const { listTabs, registerTab, requestFromTab, unregisterTab, updateTabPage } = await import(
  '../../lib/docs/tabChannel.js'
);
const { default: devInspectHandler } = await import('./devInspect.js');
const { default: inspectStateFromTab } = await import('../../lib/docs/inspectStateFromTab.js');
const { default: isTabAnswer } = await import('../lib/isTabAnswer.js');
const { default: localDevToolsOnly } = await import('../middleware/localDevToolsOnly.js');

// The tab channel's payloads, shared with @lowdefy/shell's dev-tab client tests.
const fixtures = JSON.parse(
  fs.readFileSync(new URL('../../test/tabChannelFixtures.json', import.meta.url), 'utf8')
);

// As app.js mounts it: a phone paired with lowdefy dev --lan may answer, nothing else.
function createApp() {
  const app = new Hono();
  const tabChannelOnly = localDevToolsOnly({ allowPaired: isTabAnswer });
  app.use('/api/dev-inspect', tabChannelOnly);
  app.use('/api/dev-inspect/*', tabChannelOnly);
  app.all('/api/dev-inspect', devInspectHandler);
  app.all('/api/dev-inspect/*', devInspectHandler);
  return app;
}

// A phone shell (Lowdefy Dev) sends no Origin; it names itself with x-lowdefy-shell. The
// manager's proxy marks one paired over the network with x-lowdefy-dev-remote.
const shellHeaders = {
  host: 'localhost:3001',
  'content-type': 'application/json',
  'x-lowdefy-shell': '7.0.0',
};
const pairedShellHeaders = {
  ...shellHeaders,
  host: '192.168.1.20:3001',
  'x-lowdefy-dev-remote': '1',
};

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

function connectTab({ id, pageId, send = vi.fn() }) {
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
  const send = vi.fn();
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

function connectFixtureTab(send) {
  registerTab({ id: 'phone', send });
  updateTabPage({ id: 'phone', ...fixtures.page });
}

test("an inspect-request carries the page instance, and a shell's answer reads as the browser tab's", async () => {
  const send = vi.fn();
  connectFixtureTab(send);
  const pending = inspectStateFromTab({ pageId: fixtures.page.pageId });
  const [event, request] = send.mock.calls[0];
  expect(event).toBe(fixtures.inspectRequest.event);
  expect(request).toEqual({
    requestId: expect.any(String),
    ...fixtures.page,
    ...fixtures.inspectRequest.payload,
  });

  const res = await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: pairedShellHeaders,
    body: JSON.stringify({
      requestId: request.requestId,
      result: serializer.serializeToString(fixtures.inspectResult),
    }),
  });
  expect(res.status).toBe(200);
  await expect(pending).resolves.toEqual(fixtures.inspectResult);
});

test("an eval-request carries the expression, and a shell's answer reads as the browser tab's", async () => {
  const send = vi.fn();
  connectFixtureTab(send);
  const pending = inspectStateFromTab({
    pageId: fixtures.page.pageId,
    evaluate: true,
    expression: fixtures.evalRequest.payload.expression,
  });
  const [event, request] = send.mock.calls[0];
  expect(event).toBe(fixtures.evalRequest.event);
  expect(request).toEqual({
    requestId: expect.any(String),
    ...fixtures.page,
    ...fixtures.evalRequest.payload,
  });

  await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: shellHeaders,
    body: JSON.stringify({
      requestId: request.requestId,
      result: {
        value: serializer.serializeToString(fixtures.evalResult.value),
        errors: fixtures.evalResult.errors,
      },
    }),
  });
  await expect(pending).resolves.toEqual(fixtures.evalResult);
});

test('a paired phone shell posts the page it shows', async () => {
  connectFixtureTab(vi.fn());
  const res = await createApp().request('/api/dev-inspect/page', {
    method: 'POST',
    headers: pairedShellHeaders,
    body: JSON.stringify({ tabId: 'phone', pageId: 'home', instanceKey: 'page:home' }),
  });
  expect(res.status).toBe(200);
  expect(listTabs()[0].pageId).toBe('home');
});

test.each([
  ['lists the tabs', 'GET', '/api/dev-inspect'],
  ['gets another route', 'GET', '/api/dev-inspect/tabs/phone'],
  ['posts to another route', 'POST', '/api/dev-inspect/tabs/phone'],
])('a paired phone shell is refused when it %s', async (_, method, path) => {
  const res = await createApp().request(path, { method, headers: pairedShellHeaders });
  expect(res.status).toBe(403);
});

test('a request with no Origin that does not name a shell is refused', async () => {
  const res = await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: { host: 'localhost:3001', 'content-type': 'application/json' },
    body: JSON.stringify({ requestId: 'r', result: {} }),
  });
  expect(res.status).toBe(403);
});

test('a page on another site is refused even when it names a shell', async () => {
  const res = await createApp().request('/api/dev-inspect', {
    method: 'POST',
    headers: { ...shellHeaders, origin: 'https://evil.example' },
    body: JSON.stringify({ requestId: 'r', result: {} }),
  });
  expect(res.status).toBe(403);
});
