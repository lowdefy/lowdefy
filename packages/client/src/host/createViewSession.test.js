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

import { expect, test, vi } from 'vitest';

import createFakeViewLoader from '../test/createFakeViewLoader.js';
import createMemoryTokenStore from './createMemoryTokenStore.js';
import createViewBridge from './createViewBridge.js';
import createViewSession from './createViewSession.js';

const apiBase = 'https://app.example.com/base';

function respond(status) {
  return { status, ok: status >= 200 && status < 300 };
}

// fetch answers 200 to a call that carries one of validTokens and 401 to any other.
function setup({ tokens, validTokens = ['token-1'] } = {}) {
  const view = createFakeViewLoader({ basePath: '/base', tokens });
  const valid = new Set(validTokens);
  const fetch = vi.fn(async (_, init) => {
    const token = init?.headers?.Authorization?.replace('Bearer ', '');
    return respond(valid.has(token) ? 200 : 401);
  });
  const onEnded = vi.fn();
  const tokenStore = createMemoryTokenStore();
  const session = createViewSession({
    apiBase,
    bridge: createViewBridge({ view }),
    fetch,
    onEnded,
    tokenStore,
  });
  return { fetch, onEnded, session, tokenStore, valid, view };
}

test('fetchApi mints the first session and sends it as a bearer to the app origin', async () => {
  const { fetch, session, tokenStore, view } = setup();
  const response = await session.fetchApi('/api/user', { headers: { Accept: 'application/json' } });
  expect(response.status).toBe(200);
  expect(tokenStore.get()).toBe('token-1');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('https://app.example.com/base/api/user', {
    headers: { Accept: 'application/json', Authorization: 'Bearer token-1' },
  });
});

test('fetchApi calls that start together share one mint', async () => {
  const { session, view } = setup();
  await Promise.all([session.fetchApi('/api/user'), session.fetchApi('/api/view/root')]);
  expect(view.host.callServerTool).toHaveBeenCalledTimes(1);
});

test('fetchApi ends the view and rejects when the first session cannot be minted', async () => {
  const { fetch, onEnded, session } = setup({ tokens: [] });
  await expect(session.fetchApi('/api/user')).rejects.toThrow('No session for you.');
  expect(onEnded).toHaveBeenCalledWith({ message: 'The view could not sign in to the app.' });
  expect(fetch).not.toHaveBeenCalled();
});

test('a 401 mints a new session and sends the call once more with it', async () => {
  const { fetch, onEnded, session, tokenStore, valid, view } = setup();
  await session.fetchApi('/api/user');
  valid.delete('token-1');
  valid.add('token-2');
  const response = await session.fetch(`${apiBase}/api/request/page/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
    body: '{}',
  });
  expect(response.status).toBe(200);
  expect(tokenStore.get()).toBe('token-2');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenLastCalledWith(`${apiBase}/api/request/page/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-2' },
    body: '{}',
  });
  expect(onEnded).not.toHaveBeenCalled();
});

test('a second 401 in a row ends the view and returns the refusal', async () => {
  const { fetch, onEnded, session, valid } = setup();
  await session.fetchApi('/api/user');
  valid.clear();
  fetch.mockClear();
  const response = await session.fetchApi('/api/user');
  expect(response.status).toBe(401);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(onEnded).toHaveBeenCalledWith({ message: 'The app refused the session of the view.' });
});

test('a 401 ends the view when no new session can be minted', async () => {
  const { onEnded, session, valid } = setup({ tokens: ['token-1'] });
  await session.fetchApi('/api/user');
  valid.clear();
  const response = await session.fetchApi('/api/user');
  expect(response.status).toBe(401);
  expect(onEnded).toHaveBeenCalledWith({
    message: 'The view could not sign in to the app again.',
  });
});

test('calls refused together share one new session', async () => {
  const { session, valid, view } = setup();
  await session.fetchApi('/api/user');
  valid.delete('token-1');
  valid.add('token-2');
  const responses = await Promise.all([
    session.fetchApi('/api/user'),
    session.fetchApi('/api/page/tickets'),
    session.fetchApi('/api/view/root'),
  ]);
  expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
  expect(view.host.callServerTool).toHaveBeenCalledTimes(2);
});

test('a call refused for a token that was already replaced is sent again without a mint', async () => {
  const { session, tokenStore, valid, view } = setup();
  await session.fetchApi('/api/user');
  valid.delete('token-1');
  valid.add('token-9');
  tokenStore.set('token-9');
  const response = await session.fetch(`${apiBase}/api/user`, {
    headers: { Authorization: 'Bearer token-1' },
  });
  expect(response.status).toBe(200);
  expect(view.host.callServerTool).toHaveBeenCalledTimes(1);
});

test('a 401 from another origin is returned as it is and the token is not sent again', async () => {
  const { fetch, onEnded, session, view } = setup();
  const response = await session.fetch('https://other.example.com/api', {
    headers: { Authorization: 'Bearer something-else' },
  });
  expect(response.status).toBe(401);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(view.host.callServerTool).not.toHaveBeenCalled();
  expect(onEnded).not.toHaveBeenCalled();
});

test('a 401 to a call that carried no token is returned as it is', async () => {
  const { fetch, session, view } = setup();
  const response = await session.fetch(`${apiBase}/api/view/boot`);
  expect(response.status).toBe(401);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(view.host.callServerTool).not.toHaveBeenCalled();
});

test('getToken gives the token held, and mints the first session when none is held', async () => {
  const { session, tokenStore, view } = setup();
  await expect(session.getToken()).resolves.toBe('token-1');
  await expect(session.getToken({ renew: false })).resolves.toBe('token-1');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(1);
  expect(tokenStore.get()).toBe('token-1');
});

test('getToken with renew mints a new session and keeps it for the calls that follow', async () => {
  const { fetch, session, tokenStore, view } = setup({ validTokens: ['token-1', 'token-2'] });
  await session.getToken();
  await expect(session.getToken({ renew: true })).resolves.toBe('token-2');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(2);
  expect(tokenStore.get()).toBe('token-2');
  await session.fetchApi('/api/user');
  expect(fetch).toHaveBeenLastCalledWith('https://app.example.com/base/api/user', {
    headers: { Authorization: 'Bearer token-2' },
  });
});

test('getToken rejects when no session can be minted, without ending the view', async () => {
  const { onEnded, session } = setup({ tokens: [] });
  await expect(session.getToken()).rejects.toThrow('No session for you.');
  expect(onEnded).not.toHaveBeenCalled();
});
