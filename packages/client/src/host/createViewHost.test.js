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

import { HOST_KEYS } from '@lowdefy/client-core/createLowdefyCore.js';
import { expect, test, vi } from 'vitest';

import createViewRouter from '../adapters/createViewRouter.js';
import createFakeViewLoader from '../test/createFakeViewLoader.js';
import createViewBridge from './createViewBridge.js';
import createViewHost from './createViewHost.js';

// A method needs `new`, so this is a function, not an arrow.
function FakeWebSocket(...args) {
  this.args = args;
  this.close = vi.fn();
}
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;

function setup({ basePath = '/base', path = '/tickets/12?tab=notes', status = 200, tokens } = {}) {
  const view = createFakeViewLoader({ basePath, path, tokens });
  const listened = [];
  const fakeWindow = {
    // A method, as the window's own are: it has no prototype, and it needs its receiver.
    addEventListener(...args) {
      listened.push({ args, receiver: this });
    },
    listened,
    document: { addEventListener: vi.fn(), removeEventListener: vi.fn(), title: 'frame' },
    fetch: vi.fn(async () => ({ status: fakeWindow.status, ok: fakeWindow.status === 200 })),
    innerWidth: 800,
    location: { href: 'https://sandbox.example.net/frame', origin: 'https://sandbox.example.net' },
    localStorage: { setItem: vi.fn() },
    open: vi.fn(),
    sessionStorage: { setItem: vi.fn() },
    status,
    WebSocket: FakeWebSocket,
  };
  const router = createViewRouter({ basePath, path });
  const host = createViewHost({ bridge: createViewBridge({ view }), router, window: fakeWindow });
  return { fakeWindow, host, router, view };
}

test('createViewHost gives every key the core asks of a host, as a bearer host', () => {
  const { host } = setup();
  HOST_KEYS.forEach((key) => {
    expect(key in host).toBe(true);
  });
  expect(host.authTransport).toBe('bearer');
  expect(host.tokenStore.get()).toBeNull();
});

test('createViewHost apiBase is the app origin with the basePath', () => {
  expect(setup().host.apiBase).toBe('https://app.example.com/base');
  expect(setup({ basePath: '' }).host.apiBase).toBe('https://app.example.com');
});

test('createViewHost location is the view address on the app origin, not the frame location', () => {
  const { host, router } = setup();
  const { location } = host.globals.window;
  expect(location.origin).toBe('https://app.example.com');
  expect(location.host).toBe('app.example.com');
  expect(location.protocol).toBe('https:');
  expect(location.pathname).toBe('/base/tickets/12');
  expect(location.search).toBe('?tab=notes');
  expect(location.href).toBe('https://app.example.com/base/tickets/12?tab=notes');
  router.push({ pathname: '/tickets/13', query: { tab: 'files' } });
  expect(location.href).toBe('https://app.example.com/base/tickets/13?tab=files');
});

test('createViewHost window reads everything but location from the frame window', () => {
  const { fakeWindow, host } = setup();
  const viewWindow = host.globals.window;
  expect(viewWindow.innerWidth).toBe(800);
  expect(viewWindow.WebSocket).toBe(fakeWindow.WebSocket);
  viewWindow.addEventListener('resize', 'listener');
  expect(fakeWindow.listened).toEqual([{ args: ['resize', 'listener'], receiver: fakeWindow }]);
  viewWindow.__lowdefy_test = 1;
  expect(fakeWindow.__lowdefy_test).toBe(1);
  expect(host.globals.document).toBe(fakeWindow.document);
});

test('createViewHost location.assign hands the absolute URL to the host to open', () => {
  const { host, view } = setup();
  host.globals.window.location.assign('/base/login?callbackUrl=%2Fbase%2Ftickets');
  expect(view.host.openLink).toHaveBeenCalledWith({
    url: 'https://app.example.com/base/login?callbackUrl=%2Fbase%2Ftickets',
  });
});

test('createViewHost keeps its stores in memory and the token out of browser storage', async () => {
  const { fakeWindow, host } = setup();
  host.storage.set('a', 'one');
  host.sessionStorage.set('b', 'two');
  await host.view.fetchApi('/api/user');
  expect(host.storage.get('a')).toBe('one');
  expect(host.sessionStorage.get('b')).toBe('two');
  expect(host.tokenStore.get()).toBe('token-1');
  expect(fakeWindow.localStorage.setItem).not.toHaveBeenCalled();
  expect(fakeWindow.sessionStorage.setItem).not.toHaveBeenCalled();
  expect(fakeWindow.fetch).toHaveBeenCalledWith('https://app.example.com/base/api/user', {
    headers: { Authorization: 'Bearer token-1' },
  });
});

test('createViewHost globals.fetch never carries the session', async () => {
  const { fakeWindow, host } = setup();
  await host.view.fetchApi('/api/user');
  await host.globals.fetch('https://other.example.com/data', { method: 'GET' });
  expect(fakeWindow.fetch).toHaveBeenLastCalledWith('https://other.example.com/data', {
    method: 'GET',
  });
});

test('createViewHost tells its listeners of a build or caller change and reloads nothing', () => {
  const { fakeWindow, host } = setup();
  fakeWindow.location.reload = vi.fn();
  const onBuild = vi.fn();
  const onCaller = vi.fn();
  const stopBuild = host.view.onBuildChange(onBuild);
  host.view.onCallerChange(onCaller);
  host.onBuildChanged({ serverBuildId: 'build-2' });
  host.onCallerChanged({ caller: 'user-2' });
  expect(onBuild).toHaveBeenCalledWith({ serverBuildId: 'build-2' });
  expect(onCaller).toHaveBeenCalledWith({ caller: 'user-2' });
  stopBuild();
  host.onBuildChanged({ serverBuildId: 'build-3' });
  expect(onBuild).toHaveBeenCalledTimes(1);
  expect(fakeWindow.location.reload).not.toHaveBeenCalled();
});

test('createViewHost location.reload tells the reload listeners and leaves the frame alone', () => {
  const { fakeWindow, host } = setup();
  fakeWindow.location.reload = vi.fn();
  const onReload = vi.fn();
  host.view.onReload(onReload);
  host.globals.window.location.reload();
  expect(onReload).toHaveBeenCalledTimes(1);
  expect(fakeWindow.location.reload).not.toHaveBeenCalled();
});

test('createViewHost shows the fallback once when a second 401 follows a new session', async () => {
  const { host, view } = setup({ status: 401 });
  const onCaller = vi.fn();
  host.view.onCallerChange(onCaller);
  const response = await host.view.fetchApi('/api/user');
  expect(response.status).toBe(401);
  expect(host.view.isEnded()).toBe(true);
  expect(view.showFallback).toHaveBeenCalledTimes(1);
  expect(view.showFallback).toHaveBeenCalledWith({
    message: 'The app refused the session of the view.',
  });
  // The core's own handling of the 401 that follows changes nothing more.
  host.onCallerChanged(null);
  host.onBuildChanged({ serverBuildId: 'build-2' });
  await host.view.fetchApi('/api/user');
  expect(onCaller).not.toHaveBeenCalled();
  expect(view.showFallback).toHaveBeenCalledTimes(1);
});

test('createViewHost shows the fallback when no session can be minted', async () => {
  const { host, view } = setup({ tokens: [] });
  await expect(host.view.fetchApi('/api/view/root')).rejects.toThrow('No session for you.');
  expect(view.showFallback).toHaveBeenCalledWith({
    message: 'The view could not sign in to the app.',
  });
});

test('createViewHost builds the websocket URL from the absolute API path', () => {
  const { fakeWindow, host } = setup();
  expect(host.websocketUrl('https://app.example.com/base/api/websocket')).toBe(
    'wss://app.example.com/base/api/websocket'
  );
  const socket = new host.WebSocket('wss://app.example.com/base/api/websocket', ['lowdefy.view']);
  expect(socket).toBeInstanceOf(fakeWindow.WebSocket);
  expect(socket.args).toEqual(['wss://app.example.com/base/api/websocket', ['lowdefy.view']]);
  expect(host.WebSocket.OPEN).toBe(1);
});

test('createViewHost ends by telling the end listeners, closing its websockets and showing the fallback', () => {
  const { host, view } = setup();
  const socket = new host.WebSocket('wss://app.example.com/base/api/websocket');
  socket.onclose = vi.fn();
  const order = [];
  host.view.onEnd(() => order.push(`unmount, socket closed: ${socket.close.mock.calls.length}`));
  view.showFallback.mockImplementation(() => order.push('fallback'));
  host.view.end({ message: 'The view could not load the page again.' });
  host.view.end({ message: 'Again.' });
  expect(order).toEqual(['unmount, socket closed: 0', 'fallback']);
  expect(socket.close).toHaveBeenCalledTimes(1);
  expect(socket.onclose).toBeNull();
  expect(host.view.isEnded()).toBe(true);
});

test('createViewHost shows the fallback when an end listener throws', () => {
  const { host, view } = setup();
  host.view.onEnd(() => {
    throw new Error('unmount failed');
  });
  expect(() => host.view.end({ message: 'Ended.' })).toThrow('unmount failed');
  expect(view.showFallback).toHaveBeenCalledWith({ message: 'Ended.' });
});

test('createViewHost signs a websocket handshake with the session as subprotocols', async () => {
  const { host, view } = setup();
  const decode = (protocol) =>
    Buffer.from(protocol.slice('lowdefy.view.bearer.'.length), 'base64url').toString('utf8');
  const first = await host.websocketProtocols({ renew: false });
  expect(first[0]).toBe('lowdefy.view');
  expect(decode(first[1])).toBe('token-1');
  const renewed = await host.websocketProtocols({ renew: true });
  expect(decode(renewed[1])).toBe('token-2');
  expect(host.tokenStore.get()).toBe('token-2');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(2);
  expect(host.websocketUrl('https://app.example.com/base/api/websocket')).toBe(
    'wss://app.example.com/base/api/websocket'
  );
});

test('createViewHost window.open asks the host to open the link and never opens in the frame', () => {
  const { fakeWindow, host, view } = setup();
  const handle = host.globals.window.open('/base/runs?state=open', '_blank');
  expect(handle.closed).toBe(true);
  expect(view.host.openLink).toHaveBeenCalledWith({
    url: 'https://app.example.com/base/runs?state=open',
  });
  expect(fakeWindow.open).not.toHaveBeenCalled();
});

test('createViewHost hands the host http and https URLs only', async () => {
  const { fakeWindow, host, view } = setup();
  const { location, open } = host.globals.window;
  ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd'].forEach((url) => {
    expect(open(url, '_blank')).toBeNull();
    location.assign(url);
    location.replace(url);
  });
  await expect(host.view.openLink({ url: 'javascript:alert(1)' })).resolves.toBe(false);
  expect(view.host.openLink).not.toHaveBeenCalled();
  expect(fakeWindow.open).not.toHaveBeenCalled();
});

test('createViewHost resolves a relative link against the view address', async () => {
  const { host, view } = setup();
  await host.view.openLink({ url: '?tab=files' });
  expect(view.host.openLink).toHaveBeenCalledWith({
    url: 'https://app.example.com/base/tickets/12?tab=files',
  });
});

test('createViewHost tells the link listeners when the host refuses a link', async () => {
  const { host, view } = setup();
  view.host.openLink.mockResolvedValueOnce({ isError: true });
  const listener = vi.fn();
  const stopListening = host.view.onLinkRefused(listener);
  await expect(host.view.openLink({ url: 'https://other.example.org/' })).resolves.toBe(false);
  expect(listener).toHaveBeenCalledWith({ url: 'https://other.example.org/' });
  stopListening();
  view.host.openLink.mockResolvedValueOnce({ isError: true });
  await host.view.openLink({ url: 'https://other.example.org/' });
  expect(listener).toHaveBeenCalledTimes(1);
});

test('createViewHost captures the frame links only while asked to, and puts window.open back', () => {
  const { fakeWindow, host, view } = setup();
  const frameOpen = fakeWindow.open;
  expect(fakeWindow.document.addEventListener).not.toHaveBeenCalled();

  const stopCapture = host.view.captureLinks();
  expect(fakeWindow.document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  expect(fakeWindow.open).not.toBe(frameOpen);
  fakeWindow.open('https://other.example.org/');
  expect(view.host.openLink).toHaveBeenCalledWith({ url: 'https://other.example.org/' });
  expect(frameOpen).not.toHaveBeenCalled();

  stopCapture();
  expect(fakeWindow.open).toBe(frameOpen);
  expect(fakeWindow.document.removeEventListener).toHaveBeenCalledWith(
    'click',
    expect.any(Function)
  );
});
