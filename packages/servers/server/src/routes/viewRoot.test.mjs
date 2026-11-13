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

import { Hono } from 'hono';
import { vi, beforeEach, expect, test } from 'vitest';

const mockGetRootConfig = vi.fn();

vi.doMock('@lowdefy/api', () => ({ getRootConfig: mockGetRootConfig }));

const { default: viewRootHandler } = await import('./viewRoot.js');

function get(context) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', context);
    await next();
  });
  app.get('/api/view/root', viewRootHandler);
  return app.request('/api/view/root');
}

beforeEach(() => {
  mockGetRootConfig.mockReset();
  mockGetRootConfig.mockResolvedValue({ home: { pageId: 'home' }, menus: [] });
});

test('/api/view/root answers a view session with the root config of its user', async () => {
  const context = {
    user: { id: 'user-1' },
    viewSession: { clientId: 'client-1', grantedScopes: ['mcp:read'] },
  };
  const res = await get(context);
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ home: { pageId: 'home' }, menus: [] });
  expect(mockGetRootConfig).toHaveBeenCalledWith(context);
});

test('/api/view/root answers 401 to a caller with no session, so a view mints a new one', async () => {
  const res = await get({ user: null, viewSession: null });
  expect(res.status).toEqual(401);
  expect(await res.json()).toEqual({
    name: 'AuthenticationError',
    message: 'A view session is required.',
  });
  expect(mockGetRootConfig).not.toHaveBeenCalled();
});

test('/api/view/root refuses a signed-in caller that holds no view session', async () => {
  const res = await get({ user: { id: 'user-1' }, viewSession: null });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    name: 'AuthorizationError',
    message: 'A view session is required.',
  });
  expect(mockGetRootConfig).not.toHaveBeenCalled();
});
