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

import fetchApi from './fetchApi.js';

test('fetchApi sends the call as given under apiBase on a host that shows no view', async () => {
  const response = { ok: true };
  const host = { fetch: vi.fn(async () => response) };
  const init = { method: 'POST', credentials: 'include', body: '{}' };
  const result = await fetchApi({
    init,
    lowdefy: { _internal: { host }, apiBase: '/app' },
    path: '/api/agent/page/agent',
  });
  expect(result).toBe(response);
  expect(host.fetch).toHaveBeenCalledTimes(1);
  expect(host.fetch).toHaveBeenCalledWith('/app/api/agent/page/agent', init);
});

test('fetchApi sends the call from the root when the app has no apiBase', async () => {
  const host = { fetch: vi.fn(async () => ({ ok: true })) };
  await fetchApi({ init: { method: 'POST' }, lowdefy: { _internal: { host } }, path: '/api/x' });
  expect(host.fetch).toHaveBeenCalledWith('/api/x', { method: 'POST' });
});

test('fetchApi sends a view call through the signed-in fetch of the view, asking for no cookie', async () => {
  const response = { ok: true };
  const host = {
    fetch: vi.fn(),
    view: { fetchApi: vi.fn(async () => response) },
  };
  const result = await fetchApi({
    init: { method: 'POST', credentials: 'include', body: '{}' },
    lowdefy: { _internal: { host }, apiBase: 'https://app.example.com/app' },
    path: '/api/client-error',
  });
  expect(result).toBe(response);
  expect(host.fetch).not.toHaveBeenCalled();
  expect(host.view.fetchApi).toHaveBeenCalledWith('/api/client-error', {
    method: 'POST',
    credentials: 'omit',
    body: '{}',
  });
});
