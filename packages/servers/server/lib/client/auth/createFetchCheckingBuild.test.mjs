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

import { jest } from '@jest/globals';

import createFetchCheckingBuild from './createFetchCheckingBuild.js';

const fetchCheckingBuild = createFetchCheckingBuild({ buildId: 'build-1' });

function mockFetch({ status, buildId }) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(buildId ? { 'x-lowdefy-build': buildId } : {}),
  };
  global.fetch = jest.fn(() => Promise.resolve(response));
  return response;
}

function createWindow() {
  const stored = {};
  return {
    location: { reload: jest.fn() },
    sessionStorage: {
      getItem: (key) => stored[key] ?? null,
      setItem: (key, value) => {
        stored[key] = value;
      },
    },
  };
}

beforeEach(() => {
  global.window = createWindow();
});

afterEach(() => {
  delete global.fetch;
  delete global.window;
});

async function settles(promise) {
  const marker = Symbol('pending');
  const result = await Promise.race([promise, new Promise((r) => setTimeout(() => r(marker), 20))]);
  return result !== marker;
}

test('fetchCheckingBuild reloads and never settles when an auth call fails against a newer build', async () => {
  mockFetch({ status: 404, buildId: 'build-2' });
  const promise = fetchCheckingBuild('/api/auth/session', {});
  expect(await settles(promise)).toBe(false);
  expect(window.location.reload).toHaveBeenCalledTimes(1);
});

test('fetchCheckingBuild returns a failed response from the same build without reloading', async () => {
  const response = mockFetch({ status: 401, buildId: 'build-1' });
  await expect(fetchCheckingBuild('/api/auth/sign-in/email', {})).resolves.toBe(response);
  expect(window.location.reload).not.toHaveBeenCalled();
});

test('fetchCheckingBuild returns a successful response from a newer build without reloading', async () => {
  const response = mockFetch({ status: 200, buildId: 'build-2' });
  await expect(fetchCheckingBuild('/api/auth/get-session', {})).resolves.toBe(response);
  expect(window.location.reload).not.toHaveBeenCalled();
});

test('fetchCheckingBuild returns a failed response without a build header without reloading', async () => {
  const response = mockFetch({ status: 502 });
  await expect(fetchCheckingBuild('/api/auth/get-session', {})).resolves.toBe(response);
  expect(window.location.reload).not.toHaveBeenCalled();
});

test('fetchCheckingBuild reloads at most once for the same newer build', async () => {
  mockFetch({ status: 404, buildId: 'build-2' });
  fetchCheckingBuild('/api/auth/session', {});
  await new Promise((r) => setTimeout(r, 0));
  const response = mockFetch({ status: 404, buildId: 'build-2' });
  await expect(fetchCheckingBuild('/api/auth/session', {})).resolves.toBe(response);
  expect(window.location.reload).toHaveBeenCalledTimes(1);
});

test('fetchCheckingBuild passes the request through to fetch unchanged', async () => {
  mockFetch({ status: 200, buildId: 'build-1' });
  const init = { method: 'POST', body: '{}' };
  await fetchCheckingBuild('/api/auth/sign-out', init);
  expect(global.fetch).toHaveBeenCalledWith('/api/auth/sign-out', init);
});
