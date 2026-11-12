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

import fetchViewPage from './fetchViewPage.js';

function createHost(response) {
  return { view: { fetchApi: vi.fn(async () => response) } };
}

test('fetchViewPage fetches the page by path with the query, through the view session', async () => {
  const host = createHost({
    ok: true,
    status: 200,
    json: async () => ({ pageId: 'ticket', pageConfig: { pageId: 'ticket' } }),
    headers: { get: (name) => (name === 'x-lowdefy-caller' ? 'stamp-1' : null) },
  });
  const fetched = await fetchViewPage({ fetchPath: 'tickets/12', host, search: '?tab=notes' });
  expect(host.view.fetchApi).toHaveBeenCalledWith('/api/page/tickets/12?tab=notes');
  expect(fetched).toEqual({
    shown: true,
    response: { pageId: 'ticket', pageConfig: { pageId: 'ticket' } },
    serverCaller: 'stamp-1',
  });
});

test('fetchViewPage answers a page that is not a view page as not shown, with its surface', async () => {
  const host = createHost({
    ok: false,
    status: 404,
    json: async () => ({ pageConfig: null, surface: 'web' }),
  });
  expect(await fetchViewPage({ fetchPath: 'settings', host, search: '' })).toEqual({
    shown: false,
    status: 404,
    surface: 'web',
  });
});

test('fetchViewPage never shows what a refusal carries, even a crafted page config', async () => {
  const host = createHost({
    ok: false,
    status: 404,
    json: async () => ({ pageConfig: { pageId: 'settings' }, pageId: 'settings', surface: 'web' }),
  });
  const fetched = await fetchViewPage({ fetchPath: 'settings', host, search: '' });
  expect(fetched.shown).toBe(false);
  expect(fetched.response).toBeUndefined();
});

test('fetchViewPage answers a path that names no page as not shown, with no surface', async () => {
  const host = createHost({ ok: false, status: 404, json: async () => ({ pageConfig: null }) });
  expect(await fetchViewPage({ fetchPath: 'nope', host, search: '' })).toEqual({
    shown: false,
    status: 404,
    surface: undefined,
  });
});

test('fetchViewPage answers a refusal without a JSON body as not shown', async () => {
  const host = createHost({
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError('Unexpected token <');
    },
  });
  expect(await fetchViewPage({ fetchPath: 'tickets/12', host, search: '' })).toEqual({
    shown: false,
    status: 502,
    surface: undefined,
  });
});
