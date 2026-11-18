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

import loadViewStart from './loadViewStart.js';

const rootConfig = {
  home: { pageId: 'home' },
  pagePaths: { home: 'home', ticket: 'tickets/{ticket_id}' },
};
const user = { id: 'user-1' };
const pageConfig = { pageId: 'ticket', path: 'tickets/{ticket_id}' };

function json(status, body) {
  return { status, ok: status === 200, json: async () => body, headers: { get: () => null } };
}

function createHost({ location, responses }) {
  return {
    router: { getLocation: () => location },
    view: {
      fetchApi: vi.fn(async (path) => responses[path] ?? json(404, { pageConfig: null })),
    },
  };
}

const location = { path: 'tickets/12', pathname: '/base/tickets/12', search: '?tab=notes' };

function pageResponse(buildId = 'build-1') {
  return json(200, {
    buildId,
    matchedPath: 'tickets/12',
    pageConfig,
    pageId: 'ticket',
    pathParams: { ticket_id: '12' },
  });
}

test('loadViewStart fetches the root config, the user and the page at the router location', async () => {
  const host = createHost({
    location,
    responses: {
      '/api/view/root': json(200, rootConfig),
      '/api/user': json(200, { user }),
      '/api/page/tickets/12?tab=notes': pageResponse(),
    },
  });
  const loadPageTypes = vi.fn(async () => undefined);
  const start = await loadViewStart({ bundleBuildId: 'build-1', host, loadPageTypes });
  expect(start).toEqual({
    newBuild: false,
    page: { matchedPath: 'tickets/12', pageConfig, pathParams: { ticket_id: '12' } },
    rootConfig,
    user,
  });
  expect(loadPageTypes).toHaveBeenCalledWith({ pageConfig });
  expect(host.view.fetchApi.mock.calls.map(([path]) => path)).toEqual([
    '/api/view/root',
    '/api/user',
    '/api/page/tickets/12?tab=notes',
  ]);
});

test('loadViewStart fetches the home page path when the view address is the app root', async () => {
  const host = createHost({
    location: { path: '', pathname: '/', search: '' },
    responses: {
      '/api/view/root': json(200, rootConfig),
      '/api/user': json(200, { user }),
      '/api/page/home': json(200, {
        buildId: 'build-1',
        matchedPath: 'home',
        pageConfig: { pageId: 'home' },
        pathParams: {},
      }),
    },
  });
  const start = await loadViewStart({
    bundleBuildId: 'build-1',
    host,
    loadPageTypes: async () => undefined,
  });
  expect(start.page).toEqual({ matchedPath: '', pageConfig: { pageId: 'home' }, pathParams: {} });
});

test('loadViewStart shows no page from another build than the bundle', async () => {
  const host = createHost({
    location,
    responses: {
      '/api/view/root': json(200, rootConfig),
      '/api/user': json(200, { user }),
      '/api/page/tickets/12?tab=notes': pageResponse('build-2'),
    },
  });
  const loadPageTypes = vi.fn();
  const start = await loadViewStart({ bundleBuildId: 'build-1', host, loadPageTypes });
  expect(start).toEqual({ newBuild: true, page: null, rootConfig, user });
  expect(loadPageTypes).not.toHaveBeenCalled();
});

test('loadViewStart throws when the app does not serve the page to the view', async () => {
  const host = createHost({
    location,
    responses: { '/api/view/root': json(200, rootConfig), '/api/user': json(200, { user }) },
  });
  await expect(
    loadViewStart({ bundleBuildId: 'build-1', host, loadPageTypes: vi.fn() })
  ).rejects.toThrow('The app answered 404 for the page of this view.');
});

test('loadViewStart throws when the root config is refused', async () => {
  const host = createHost({
    location,
    responses: { '/api/view/root': json(403, {}), '/api/user': json(200, { user }) },
  });
  await expect(
    loadViewStart({ bundleBuildId: 'build-1', host, loadPageTypes: vi.fn() })
  ).rejects.toThrow('The app answered 403 to /api/view/root.');
});
