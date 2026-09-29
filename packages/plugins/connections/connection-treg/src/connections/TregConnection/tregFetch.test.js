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

import { ServiceError } from '@lowdefy/errors';

import startMockTreg from '../../test/startMockTreg.js';
import tregFetch from './tregFetch.js';

const TOKEN = 'tok_live_5ecret_value';

test('tregFetch maps a refused connection to a ServiceError without the token', async () => {
  const mock = await startMockTreg(() => ({}));
  const { baseUrl } = mock;
  await mock.close();
  let error;
  try {
    await tregFetch({ connection: { token: TOKEN, baseUrl }, path: '/call/a.b' });
  } catch (err) {
    error = err;
  }
  expect(error).toBeInstanceOf(ServiceError);
  expect(error.message).toMatch(/^treg: Could not be reached \(/);
  expect(error.code).toBe('ECONNREFUSED');
  expect(error.message).not.toContain(TOKEN);
});

test('tregFetch maps a call that runs past the connection timeout to a ServiceError', async () => {
  const mock = await startMockTreg(() => ({ hang: true }));
  let error;
  try {
    await tregFetch({
      connection: { token: TOKEN, baseUrl: mock.baseUrl, timeout: 100 },
      path: '/call/a.b',
    });
  } catch (err) {
    error = err;
  }
  await mock.close();
  expect(error).toBeInstanceOf(ServiceError);
  expect(error.message).toBe('treg: Did not answer within 100 ms.');
  expect(error.code).toBe('ETIMEDOUT');
});

test('tregFetch rethrows the abort when the request that started the call closes', async () => {
  const mock = await startMockTreg(() => ({ hang: true }));
  const controller = new AbortController();
  const promise = tregFetch({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    path: '/call/a.b',
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 50);
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  await mock.close();
});

test('tregFetch does not follow a redirect, so the token never reaches another host', async () => {
  const other = await startMockTreg(() => ({ status: 200, body: { stolen: true } }));
  const mock = await startMockTreg(() => ({
    status: 302,
    headers: { location: `${other.baseUrl}/steal` },
    body: '',
  }));
  const response = await tregFetch({
    connection: { token: TOKEN, baseUrl: mock.baseUrl },
    path: '/call/a.b',
  });
  expect(response.status).toBe(302);
  expect(other.requests).toHaveLength(0);
  await mock.close();
  await other.close();
});

test('tregFetch defaults the base URL to https://treg.to', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response('{"ok":true}', { status: 200 });
  };
  try {
    const response = await tregFetch({ connection: { token: TOKEN }, path: '/catalog/search' });
    expect(response.body).toEqual({ ok: true });
  } finally {
    global.fetch = originalFetch;
  }
  expect(calls[0].url).toBe('https://treg.to/catalog/search');
  expect(calls[0].options.headers['x-treg-token']).toBe(TOKEN);
  expect(calls[0].options.redirect).toBe('manual');
});
