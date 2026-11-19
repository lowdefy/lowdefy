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

import { createLowdefyCore, updateLowdefyPage } from '@lowdefy/client-core';
import { resolveTarget } from '@lowdefy/engine';
import { AuthorizationError, ConfigError } from '@lowdefy/errors';
import { afterEach, expect, test, vi } from 'vitest';

import createViewRouter from '../adapters/createViewRouter.js';
import createFakeViewLoader from '../test/createFakeViewLoader.js';
import createViewBridge from './createViewBridge.js';
import createViewHost from './createViewHost.js';

// The call sites of the client core, on the host of a page shown as an MCP App
// view: a fake MCP Apps host behind the bridge, and a fake fetch and WebSocket
// on the frame's window. The app is https://app.example.com/base; the frame is
// on the sandbox origin.

function respond({ body = {}, status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function bearerOf(init) {
  return init?.headers?.Authorization?.replace('Bearer ', '') ?? null;
}

// What the app's server reads from the second subprotocol.
function readSocketToken(protocol) {
  return Buffer.from(protocol.slice('lowdefy.view.bearer.'.length), 'base64url').toString('utf8');
}

// answer({ url, init }) gives the app's answer to a call that carries a valid
// token; a call with any other token is answered 401.
function setup({ answer = () => respond(), tokens, validTokens = ['token-1'] } = {}) {
  const view = createFakeViewLoader({ basePath: '/base', path: '/tickets/12?tab=notes', tokens });
  const valid = new Set(validTokens);
  const sockets = [];
  class FakeWebSocket {
    constructor(...args) {
      this.args = args;
      this.readyState = 0;
      this.send = vi.fn();
      this.close = vi.fn();
      sockets.push(this);
    }
  }
  FakeWebSocket.OPEN = 1;
  const fakeWindow = {
    document: {},
    fetch: vi.fn(async (url, init) => {
      if (!valid.has(bearerOf(init))) {
        return respond({ status: 401, body: { name: 'AuthenticationError', message: 'No.' } });
      }
      return answer({ init, url });
    }),
    location: { href: 'https://sandbox.example.net/frame', origin: 'https://sandbox.example.net' },
    WebSocket: FakeWebSocket,
  };
  const router = createViewRouter({ basePath: '/base', path: '/tickets/12?tab=notes' });
  const host = createViewHost({ bridge: createViewBridge({ view }), router, window: fakeWindow });
  const lowdefy = { buildId: 'build-1' };
  createLowdefyCore({
    apiBase: host.apiBase,
    auth: { authConfig: {} },
    basePath: router.basePath,
    host,
    lowdefy,
    rootConfig: { lowdefyApp: { slug: 'sales' } },
    types: { actions: {}, blocks: {}, operators: {} },
  });
  updateLowdefyPage({
    config: {
      pageConfig: { pageId: 'ticket', path: 'tickets/:id' },
      rootConfig: { home: { pageId: 'home' }, menus: [], pagePaths: {} },
    },
    lowdefy,
    matchedPath: 'tickets/12',
    pathParams: { id: '12' },
    user: { id: 'user_a' },
  });
  // handleError holds the logger it was made with.
  vi.spyOn(lowdefy._internal.logger, 'error').mockImplementation(() => undefined);
  return { fakeWindow, host, lowdefy, router, sockets, valid, view };
}

function mintCount(view) {
  return view.host.callServerTool.mock.calls.length;
}

afterEach(() => {
  vi.useRealTimers();
});

test('a client error is posted to the app with the bearer session and no cookie', async () => {
  const { fakeWindow, lowdefy } = setup({
    answer: () => respond({ body: { source: 'pages/ticket.yaml:8' } }),
  });
  const error = new ConfigError('Block type "Buton" not found.');
  await lowdefy._internal.handleError(error);
  expect(fakeWindow.fetch).toHaveBeenCalledTimes(1);
  const [url, init] = fakeWindow.fetch.mock.calls[0];
  expect(url).toBe('https://app.example.com/base/api/client-error');
  expect(init.method).toBe('POST');
  expect(init.headers.Authorization).toBe('Bearer token-1');
  expect(init.credentials).toBe('omit');
  expect(error.source).toBe('pages/ticket.yaml:8');
});

test('a block call such as the agent chat reaches the app with the bearer session and no cookie', async () => {
  const { fakeWindow, lowdefy } = setup();
  const response = await lowdefy._internal.fetchApi('/api/agent/ticket/helper', {
    body: '{"messages":[]}',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  expect(response.status).toBe(200);
  expect(fakeWindow.fetch).toHaveBeenCalledWith(
    'https://app.example.com/base/api/agent/ticket/helper',
    {
      body: '{"messages":[]}',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
      method: 'POST',
    }
  );
});

test('a 401 mid-conversation mints a new session, the message is sent again and the next one works', async () => {
  const { fakeWindow, host, lowdefy, valid, view } = setup();
  const send = () =>
    lowdefy._internal.fetchApi('/api/agent/ticket/helper', {
      body: '{"messages":[]}',
      credentials: 'include',
      method: 'POST',
    });
  expect((await send()).status).toBe(200);
  // The session ends while the conversation is open.
  valid.delete('token-1');
  valid.add('token-2');
  expect((await send()).status).toBe(200);
  expect(mintCount(view)).toBe(2);
  expect(host.tokenStore.get()).toBe('token-2');
  expect(fakeWindow.fetch.mock.calls.map(([, init]) => bearerOf(init))).toEqual([
    'token-1',
    'token-1',
    'token-2',
  ]);
  expect((await send()).status).toBe(200);
  expect(mintCount(view)).toBe(2);
  expect(host.view.isEnded()).toBe(false);
});

test('an agent call the app refuses is answered to the caller as the refusal, with no new session', async () => {
  const { lowdefy, view } = setup({
    answer: () =>
      respond({ status: 403, body: { name: 'AuthorizationError', message: 'Forbidden.' } }),
  });
  const response = await lowdefy._internal.fetchApi('/api/agent/ticket/helper', { method: 'POST' });
  expect(response.status).toBe(403);
  expect(await response.text()).toBe('{"name":"AuthorizationError","message":"Forbidden."}');
  expect(mintCount(view)).toBe(1);
});

test('the websocket connects to the wss address of the app, offering the name and the encoded token', async () => {
  const { host, lowdefy, sockets } = setup();
  await host.view.fetchApi('/api/user');
  lowdefy._internal.websocketClient.connect();
  await vi.waitFor(() => expect(sockets).toHaveLength(1));
  const [url, protocols, options] = sockets[0].args;
  expect(url).toBe('wss://app.example.com/base/api/websocket');
  expect(protocols).toHaveLength(2);
  expect(protocols[0]).toBe('lowdefy.view');
  expect(readSocketToken(protocols[1])).toBe('token-1');
  expect(options).toBe(undefined);
});

test('the websocket mints the first session when the view holds none', async () => {
  const { lowdefy, sockets, view } = setup();
  lowdefy._internal.websocketClient.connect();
  await vi.waitFor(() => expect(sockets).toHaveLength(1));
  expect(mintCount(view)).toBe(1);
  expect(readSocketToken(sockets[0].args[1][1])).toBe('token-1');
});

test('a websocket reconnect after a call minted a new session carries the new token', async () => {
  vi.useFakeTimers();
  const { host, lowdefy, sockets, valid } = setup();
  const handlers = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn(),
  };
  await host.view.fetchApi('/api/user');
  lowdefy._internal.websocketClient
    .subscribe({ handlers, payload: {}, websocketId: 'feed' })
    .catch(() => {});
  await vi.advanceTimersByTimeAsync(0);
  sockets[0].readyState = 1;
  sockets[0].onopen();
  // The session ends; a call is refused and a new session is minted.
  valid.delete('token-1');
  valid.add('token-2');
  await host.view.fetchApi('/api/user');
  expect(host.tokenStore.get()).toBe('token-2');
  // The connection drops and the client reconnects.
  sockets[0].onclose({ code: 1006 });
  await vi.advanceTimersByTimeAsync(500);
  expect(sockets).toHaveLength(2);
  expect(sockets[1].args[0]).toBe('wss://app.example.com/base/api/websocket');
  expect(readSocketToken(sockets[1].args[1][1])).toBe('token-2');
});

test('a websocket the server closes for an ended session reconnects with a newly minted one', async () => {
  vi.useFakeTimers();
  const { host, lowdefy, sockets, view } = setup();
  const handlers = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn(),
  };
  await host.view.fetchApi('/api/user');
  lowdefy._internal.websocketClient
    .subscribe({ handlers, payload: {}, websocketId: 'feed' })
    .catch(() => {});
  await vi.advanceTimersByTimeAsync(0);
  sockets[0].readyState = 1;
  sockets[0].onopen();
  sockets[0].onclose({ code: 4401 });
  await vi.advanceTimersByTimeAsync(500);
  expect(sockets).toHaveLength(2);
  expect(mintCount(view)).toBe(2);
  expect(readSocketToken(sockets[1].args[1][1])).toBe('token-2');
  expect(host.tokenStore.get()).toBe('token-2');
});

test('a websocket that cannot connect keeps the session it holds and mints no other', async () => {
  vi.useFakeTimers();
  const { host, lowdefy, sockets, view } = setup();
  const handlers = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn(),
  };
  await host.view.fetchApi('/api/user');
  lowdefy._internal.websocketClient
    .subscribe({ handlers, payload: {}, websocketId: 'feed' })
    .catch(() => {});
  await vi.advanceTimersByTimeAsync(0);
  // The feed is live, then the app's socket goes away.
  sockets[0].readyState = 1;
  sockets[0].onopen();
  sockets[0].onmessage({
    data: JSON.stringify({ type: 'subscribed', websocketId: 'feed', requestId: 's1' }),
  });
  sockets[0].onclose({ code: 1006 });
  await vi.advanceTimersByTimeAsync(15 * 1000);
  // Every handshake now ends in a close.
  for (let attempt = 2; attempt <= 12; attempt += 1) {
    expect(sockets).toHaveLength(attempt);
    sockets[attempt - 1].onclose({ code: 1006 });
    await vi.advanceTimersByTimeAsync(15 * 1000);
  }
  expect(sockets).toHaveLength(13);
  expect(mintCount(view)).toBe(1);
  expect(readSocketToken(sockets[12].args[1][1])).toBe('token-1');
  expect(host.tokenStore.get()).toBe('token-1');
});

test('a websocket the server keeps closing for a caller change mints three sessions and no more', async () => {
  vi.useFakeTimers();
  const { host, lowdefy, sockets, view } = setup({
    tokens: ['token-1', 'token-2', 'token-3', 'token-4', 'token-5', 'token-6'],
  });
  const handlers = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn(),
  };
  await host.view.fetchApi('/api/user');
  lowdefy._internal.websocketClient
    .subscribe({ handlers, payload: {}, websocketId: 'feed' })
    .catch(() => {});
  await vi.advanceTimersByTimeAsync(0);
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    expect(sockets).toHaveLength(attempt);
    sockets[attempt - 1].readyState = 1;
    sockets[attempt - 1].onopen();
    sockets[attempt - 1].onclose({ code: 4401 });
    await vi.advanceTimersByTimeAsync(15 * 1000);
  }
  expect(mintCount(view)).toBe(4);
  expect(host.tokenStore.get()).toBe('token-4');
  expect(readSocketToken(sockets[8].args[1][1])).toBe('token-4');
});

test.each([
  {
    call: 'a page request',
    run: (lowdefy) =>
      lowdefy._internal.callRequest({ pageId: 'ticket', requestId: 'save', payload: {} }),
    url: 'https://app.example.com/base/api/request/ticket/save',
  },
  {
    call: 'an endpoint call',
    run: (lowdefy) =>
      lowdefy._internal.callAPI({ endpointId: 'close_ticket', pageId: 'ticket', payload: {} }),
    url: 'https://app.example.com/base/api/endpoints/close_ticket',
  },
])(
  '$call refused with view_write_required throws the reconnect message, is not reported and mints no session',
  async ({ run, url }) => {
    const message = 'This connection is read-only. Reconnect with write access to make changes.';
    const { fakeWindow, host, lowdefy, view } = setup({
      answer: () =>
        respond({
          status: 403,
          body: { name: 'AuthorizationError', message, code: 'view_write_required' },
        }),
    });
    const callerChanged = vi.fn();
    host.view.onCallerChange(callerChanged);
    await host.view.fetchApi('/api/user');
    fakeWindow.fetch.mockClear();

    let thrown;
    try {
      await run(lowdefy);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(AuthorizationError);
    expect(thrown.message).toBe(message);
    expect(thrown.code).toBe('view_write_required');

    await lowdefy._internal.handleError(thrown);
    expect(fakeWindow.fetch).toHaveBeenCalledTimes(1);
    expect(fakeWindow.fetch.mock.calls[0][0]).toBe(url);
    expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(thrown);
    expect(mintCount(view)).toBe(1);
    expect(callerChanged).not.toHaveBeenCalled();
    expect(host.view.isEnded()).toBe(false);
  }
);

test('an endpoint call from a view carries the build id of its bundle, and a newer build is told to the view', async () => {
  const { fakeWindow, host, lowdefy } = setup({
    answer: () => respond({ status: 409, body: { message: 'Build changed.', buildId: 'build-2' } }),
  });
  const buildChanged = vi.fn();
  host.view.onBuildChange(buildChanged);
  // The view holds its session by the time a page calls an endpoint.
  await host.view.fetchApi('/api/user');
  const settled = vi.fn();
  lowdefy._internal
    .callAPI({ endpointId: 'close_ticket', pageId: 'ticket', payload: {} })
    .then(settled, settled);
  await vi.waitFor(() => expect(buildChanged).toHaveBeenCalledWith({ serverBuildId: 'build-2' }));
  const [url, init] = fakeWindow.fetch.mock.calls.at(-1);
  expect(url).toBe('https://app.example.com/base/api/endpoints/close_ticket');
  expect(init.headers['x-lowdefy-build']).toBe('build-1');
  expect(settled).not.toHaveBeenCalled();
});

test('resolveTarget classes a URL under the origin and basePath of the app as a page of this app', () => {
  const { lowdefy } = setup();
  expect(
    resolveTarget({ lowdefy, target: { url: 'https://app.example.com/base/tickets/13?tab=files' } })
  ).toEqual({ kind: 'page', pathname: '/tickets/13', query: 'tab=files' });
});

test('resolveTarget classes a URL on the sandbox origin, or outside basePath, as external', () => {
  const { lowdefy } = setup();
  expect(
    resolveTarget({ lowdefy, target: { url: 'https://sandbox.example.net/base/tickets/13' } })
  ).toEqual({ kind: 'external', href: 'https://sandbox.example.net/base/tickets/13' });
  expect(resolveTarget({ lowdefy, target: { url: 'https://app.example.com/pricing' } })).toEqual({
    kind: 'external',
    href: 'https://app.example.com/pricing',
  });
});

test('resolveTarget resolves a relative URL against the address of the view, after a navigation too', () => {
  const { lowdefy, router } = setup();
  expect(resolveTarget({ lowdefy, target: { url: '?tab=files' } })).toEqual({
    kind: 'page',
    pathname: '/tickets/12',
    query: 'tab=files',
  });
  router.push({ pathname: '/tickets/13', query: { tab: 'notes' } });
  expect(resolveTarget({ lowdefy, target: { url: '?tab=files' } })).toEqual({
    kind: 'page',
    pathname: '/tickets/13',
    query: 'tab=files',
  });
});
