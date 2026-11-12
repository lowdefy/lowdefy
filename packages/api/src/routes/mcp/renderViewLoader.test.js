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

import vm from 'node:vm';

import { expect, test, vi } from 'vitest';

import darkModeScript from '../../html/darkModeScript.js';
import layerOrderScript from '../../html/layerOrderScript.js';
import renderViewLoader from './renderViewLoader.js';

const html = renderViewLoader({
  appOrigin: 'https://app.example.com',
  basePath: '/base',
  slug: 'tasks',
  themeConfig: { darkMode: 'dark', antd: { darkToken: { colorBgLayout: '#111' } } },
});

function createElement(tagName) {
  return {
    tagName,
    children: [],
    listeners: {},
    style: {},
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((candidate) => candidate !== child);
    },
    get firstChild() {
      return this.children[0] ?? null;
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    getBoundingClientRect() {
      return { height: 320.4 };
    },
  };
}

function findById(element, id) {
  if (element.id === id) {
    return element;
  }
  for (const child of element.children) {
    const found = findById(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const boot = { buildId: 'build_1', js: 'assets/view-abc.js', css: ['assets/view-abc.css'] };

const toolResult = {
  content: [{ type: 'text', text: '{"title":"Fix the gate"}' }],
  structuredContent: { title: 'Fix the gate' },
  _meta: { 'lowdefy/view': { path: '/OPS/tasks/OPS-1?tab=files' } },
};

const hostContext = {
  displayMode: 'inline',
  toolInfo: { tool: { name: 'open-task', title: 'Open a task' } },
};

// Runs the loader script of the rendered HTML against a stand-in for the
// host's sandbox frame: a window that records what is posted to the host, a
// document that records what is added to it, and the app's boot route.
function runLoader({ fetch }) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const posted = [];
  const body = createElement('body');
  const root = createElement('div');
  root.id = 'root';
  body.appendChild(root);
  const document = {
    body,
    documentElement: createElement('html'),
    head: createElement('head'),
    createElement,
    getElementById: (id) => findById(body, id),
  };
  const parent = { postMessage: (message) => posted.push(message) };
  let onMessage;
  const window = {
    parent,
    open: vi.fn(),
    addEventListener: (type, listener) => {
      onMessage = listener;
    },
  };
  vm.runInNewContext(scripts[scripts.length - 1], { document, fetch, window });
  const host = {
    send: (data) => onMessage({ source: parent, data: { jsonrpc: '2.0', ...data } }),
    sendFromElsewhere: (data) => onMessage({ source: {}, data: { jsonrpc: '2.0', ...data } }),
    answer: (method, result) => {
      const request = posted.find((message) => message.method === method && !message.answered);
      request.answered = true;
      onMessage({ source: parent, data: { jsonrpc: '2.0', id: request.id, result } });
    },
  };
  return { document, host, posted, window };
}

function bootFetch(answer = boot) {
  return vi.fn(async () => ({ ok: true, status: 200, json: async () => answer }));
}

async function connectHost({ host }) {
  host.answer('ui/initialize', {
    protocolVersion: '2026-01-26',
    hostInfo: { name: 'host', version: '1' },
    hostCapabilities: { openLinks: {} },
    hostContext,
  });
  host.send({ method: 'ui/notifications/tool-input', params: { arguments: { key: 'OPS-1' } } });
  host.send({ method: 'ui/notifications/tool-result', params: toolResult });
  await tick();
}

function fallbackTexts(document) {
  const fallback = document.getElementById('lowdefy-view-fallback');
  return fallback === null ? null : fallback.children.map((child) => child.textContent);
}

test('renderViewLoader holds the two pre-render scripts, the app origin and the basePath', () => {
  expect(html).toContain(`<script>${layerOrderScript}</script>`);
  expect(html).toContain(
    `<script>${darkModeScript({
      configColorMode: 'dark',
      darkBg: '#111',
      lightBg: '',
      storageKey: 'lowdefy:tasks:/base:lowdefy_darkMode',
    })}</script>`
  );
  expect(html).toContain('({"origin":"https://app.example.com","basePath":"/base"});</script>');
  expect(html).toContain('<div id="root"></div>');
});

test('renderViewLoader names no file of any build and loads nothing by itself', () => {
  expect(html).not.toMatch(/<link|<script[^>]+src=|\bassets\//);
});

test('the loader connects to the host, then asks the app for its boot answer', async () => {
  const fetch = bootFetch();
  const frame = runLoader({ fetch });
  expect(fetch.mock.calls).toEqual([['https://app.example.com/base/api/view/boot']]);
  expect(frame.posted).toEqual([
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'ui/initialize',
      params: {
        appInfo: { name: 'lowdefy-view', version: '1' },
        appCapabilities: {},
        protocolVersion: '2026-01-26',
      },
    },
  ]);
  await connectHost(frame);
  expect(frame.posted.slice(1).map(({ method, params }) => ({ method, params }))).toEqual([
    { method: 'ui/notifications/initialized', params: {} },
    { method: 'ui/notifications/size-changed', params: { height: 321 } },
  ]);
});

test('the loader hands the client entry one object and loads the boot answer from the app origin', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  expect(frame.window.__LOWDEFY_VIEW__).toBe(undefined);
  await connectHost(frame);
  const view = frame.window.__LOWDEFY_VIEW__;
  expect(Object.keys(view)).toEqual([
    'version',
    'origin',
    'basePath',
    'boot',
    'toolInput',
    'toolResult',
    'host',
    'showFallback',
  ]);
  expect(view.version).toEqual(1);
  expect(view.origin).toEqual('https://app.example.com');
  expect(view.basePath).toEqual('/base');
  expect(view.boot).toEqual(boot);
  expect(view.toolInput).toEqual({ arguments: { key: 'OPS-1' } });
  expect(view.toolResult).toEqual(toolResult);
  expect(Object.keys(view.host)).toEqual([
    'info',
    'capabilities',
    'getContext',
    'onContextChange',
    'callServerTool',
    'openLink',
    'sendMessage',
  ]);
  expect(view.host.info).toEqual({ name: 'host', version: '1' });
  expect(view.host.capabilities).toEqual({ openLinks: {} });
  expect(
    frame.document.head.children.map(({ tagName, rel, href }) => ({ tagName, rel, href }))
  ).toEqual([
    {
      tagName: 'link',
      rel: 'stylesheet',
      href: 'https://app.example.com/base/assets/view-abc.css',
    },
  ]);
  const script = frame.document.body.children[1];
  expect(script.tagName).toEqual('script');
  expect(script.type).toEqual('module');
  expect(script.src).toEqual('https://app.example.com/base/assets/view-abc.js');
  expect(fallbackTexts(frame.document)).toBe(null);
});

test('the host bridge calls a server tool, opens a link and sends a message through the host', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  const { host } = frame.window.__LOWDEFY_VIEW__;
  const session = host.callServerTool({ name: 'lowdefy_view_session' });
  host.openLink({ url: 'https://app.example.com/base/runs' });
  host.sendMessage({ text: 'Done.' });
  expect(frame.posted.slice(-3).map(({ method, params }) => ({ method, params }))).toEqual([
    { method: 'tools/call', params: { name: 'lowdefy_view_session', arguments: {} } },
    { method: 'ui/open-link', params: { url: 'https://app.example.com/base/runs' } },
    {
      method: 'ui/message',
      params: { role: 'user', content: [{ type: 'text', text: 'Done.' }] },
    },
  ]);
  frame.host.answer('tools/call', { content: [], _meta: { 'lowdefy/viewSession': {} } });
  expect(await session).toEqual({ content: [], _meta: { 'lowdefy/viewSession': {} } });
});

test('the host bridge gives the host context and calls its listeners when the host changes it', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  const { host } = frame.window.__LOWDEFY_VIEW__;
  expect(host.getContext().displayMode).toEqual('inline');
  const listener = vi.fn();
  const stop = host.onContextChange(listener);
  frame.host.send({
    method: 'ui/notifications/host-context-changed',
    params: { displayMode: 'fullscreen' },
  });
  expect(host.getContext().displayMode).toEqual('fullscreen');
  expect(host.getContext().toolInfo).toEqual(hostContext.toolInfo);
  expect(listener).toHaveBeenCalledTimes(1);
  stop();
  frame.host.send({
    method: 'ui/notifications/host-context-changed',
    params: { displayMode: 'inline' },
  });
  expect(listener).toHaveBeenCalledTimes(1);
});

test('the loader ignores messages that do not come from the host frame', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  const view = frame.window.__LOWDEFY_VIEW__;
  const posted = frame.posted.length;
  frame.host.sendFromElsewhere({
    method: 'ui/notifications/tool-result',
    params: { content: [{ type: 'text', text: 'Forged.' }] },
  });
  frame.host.sendFromElsewhere({ id: 99, method: 'ping' });
  expect(view.toolResult).toEqual(toolResult);
  expect(frame.posted.length).toEqual(posted);
});

test('the loader shows the tool title, the result as text and an open button when the app cannot be reached', async () => {
  const fetch = vi.fn(async () => {
    throw new Error('Failed to fetch');
  });
  const frame = runLoader({ fetch });
  await connectHost(frame);
  expect(frame.window.__LOWDEFY_VIEW__).toBe(undefined);
  expect(fallbackTexts(frame.document)).toEqual([
    'Open a task',
    '{"title":"Fix the gate"}',
    'Open in browser',
  ]);
  expect(frame.document.getElementById('root').style.display).toEqual('none');
  expect(frame.document.body.children.some((child) => child.tagName === 'script')).toBe(false);
  const button = frame.document.getElementById('lowdefy-view-fallback').children[2];
  button.listeners.click();
  expect(frame.posted[frame.posted.length - 1]).toMatchObject({
    method: 'ui/open-link',
    params: { url: 'https://app.example.com/base/OPS/tasks/OPS-1?tab=files' },
  });
});

test('the loader shows the fallback when the app answers the boot request with an error', async () => {
  const frame = runLoader({ fetch: vi.fn(async () => ({ ok: false, status: 503 })) });
  await connectHost(frame);
  expect(fallbackTexts(frame.document)).toEqual([
    'Open a task',
    '{"title":"Fix the gate"}',
    'Open in browser',
  ]);
});

test('the loader shows the fallback when the client entry script does not load', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  frame.document.body.children[1].listeners.error();
  expect(fallbackTexts(frame.document)).toEqual([
    'Open a task',
    '{"title":"Fix the gate"}',
    'Open in browser',
  ]);
});

test('showFallback lets the client entry show the fallback with a message when it cannot get a session', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  frame.window.__LOWDEFY_VIEW__.showFallback({ message: 'This view could not sign in.' });
  expect(fallbackTexts(frame.document)).toEqual([
    'Open a task',
    'This view could not sign in.',
    '{"title":"Fix the gate"}',
    'Open in browser',
  ]);
});

test('the loader shows the fallback and loads nothing when the result carries no view address', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  frame.host.answer('ui/initialize', { hostContext });
  frame.host.send({
    method: 'ui/notifications/tool-result',
    params: { content: [{ type: 'text', text: 'No such task.' }], isError: true },
  });
  await tick();
  expect(frame.window.__LOWDEFY_VIEW__).toBe(undefined);
  expect(fallbackTexts(frame.document)).toEqual([
    'Open a task',
    'No such task.',
    'Open in browser',
  ]);
  frame.document.getElementById('lowdefy-view-fallback').children[2].listeners.click();
  expect(frame.posted[frame.posted.length - 1].params).toEqual({
    url: 'https://app.example.com/base/',
  });
});

test('the loader answers a teardown request from the host', async () => {
  const frame = runLoader({ fetch: bootFetch() });
  await connectHost(frame);
  frame.host.send({ id: 7, method: 'ui/resource-teardown', params: {} });
  expect(frame.posted[frame.posted.length - 1]).toEqual({ jsonrpc: '2.0', id: 7, result: {} });
});
