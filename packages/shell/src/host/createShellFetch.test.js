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

import createAppSession from '../session/createAppSession.js';
import createFakeServer, { header } from '../test/createFakeServer.js';
import createMemoryCacheStore from '../test/createMemoryCacheStore.js';
import createMemoryStore from './createMemoryStore.js';
import createShellFetch from './createShellFetch.js';
import { createPages, createRoot } from '../test/fixtures.js';

const apiBase = 'https://field.example.com';

async function setup() {
  const server = createFakeServer({
    root: createRoot(),
    rootEtag: '"root-1"',
    pages: createPages([
      ['today', 'today', '"p-today-1"'],
      ['jobs', 'jobs', '"p-jobs-1"'],
      ['jobs/{job_id}', 'job', '"p-job-1"'],
    ]),
    requests: () => ({ id: 'get_jobs', success: true, response: [] }),
  });
  const session = createAppSession({
    apiBase,
    app: { id: 'field' },
    cacheStore: createMemoryCacheStore(),
    fetch: server.fetch,
    kv: createMemoryStore(),
    tokenStore: { get: () => null },
  });
  await session.start();
  const shellFetch = createShellFetch({ fetch: server.fetch, session });
  return { server, session, shellFetch };
}

function deploy({ server, todayHash }) {
  server.state.buildId = 'build-2';
  server.state.root = createRoot({
    buildId: 'build-2',
    pageIndex: [
      { path: 'today', pageId: 'today', hash: todayHash, typesKey: 'carried' },
      { path: 'jobs', pageId: 'jobs', hash: 'h-jobs-1', typesKey: 'carried' },
    ],
  });
  server.state.rootEtag = '"root-2"';
}

const requestInit = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-lowdefy-build': 'build-1' },
  body: '{}',
};

test('a page request carries the build of the root the shell holds', async () => {
  const { server, shellFetch } = await setup();
  const res = await shellFetch(`${apiBase}/api/request/jobs/get_jobs`, {
    ...requestInit,
    headers: { ...requestInit.headers, 'x-lowdefy-build': 'stale-core-build' },
  });
  expect(res.status).toBe(200);
  expect(header(server.fetch.mock.calls.at(-1)[1], 'x-lowdefy-build')).toBe('build-1');
});

test('a request sent with keepBuild keeps its build, so an older build gets the 409 and its retry', async () => {
  const { server, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-1' });
  server.fetch.mockClear();
  const res = await shellFetch(`${apiBase}/api/request/jobs/get_jobs`, {
    ...requestInit,
    headers: { ...requestInit.headers, 'x-lowdefy-build': 'build-0' },
    keepBuild: true,
  });
  expect(res.status).toBe(200);
  expect(header(server.fetch.mock.calls[0][1], 'x-lowdefy-build')).toBe('build-0');
  expect(server.fetch.mock.calls[0][1].keepBuild).toBeUndefined();
  expect(header(server.fetch.mock.calls.at(-1)[1], 'x-lowdefy-build')).toBe('build-2');
});

test('a 409 syncs the root and changed pages, then retries the request once on the new build', async () => {
  const { server, session, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-2' });
  server.state.pages.today = { pageConfig: { pageId: 'today', v: 2 }, etag: '"p-today-2"' };
  server.fetch.mockClear();
  const res = await shellFetch(`${apiBase}/api/request/jobs/get_jobs`, requestInit);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ id: 'get_jobs', success: true, response: [] });
  const urls = server.fetch.mock.calls.map(([url]) => new URL(url).pathname);
  expect(urls).toEqual([
    '/api/request/jobs/get_jobs',
    '/api/mobile/root',
    '/api/user',
    '/api/page/today',
    '/api/request/jobs/get_jobs',
  ]);
  expect(header(server.fetch.mock.calls.at(-1)[1], 'x-lowdefy-build')).toBe('build-2');
  expect(session.getState().buildId).toBe('build-2');
  expect(session.getState().pages.today.pageConfig.v).toBe(2);
});

test('a 409 for a page that changed with the build goes to the core, not retried', async () => {
  const { server, session, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-2' });
  server.fetch.mockClear();
  const res = await shellFetch(`${apiBase}/api/request/today/get_jobs`, requestInit);
  expect(res.status).toBe(409);
  expect((await res.json()).buildId).toBe('build-2');
  expect(server.fetch.mock.calls.filter(([url]) => url.includes('/api/request/'))).toHaveLength(1);
  expect(session.getState().buildId).toBe('build-2');
});

test('a second 409 after the retry goes to the core', async () => {
  const { server, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-1' });
  const serve = server.fetch.getMockImplementation();
  server.fetch.mockImplementation(async (url, init) => {
    if (url.includes('/api/request/')) {
      return {
        ok: false,
        status: 409,
        headers: { get: () => null },
        json: async () => ({ buildId: 'build-3' }),
      };
    }
    return serve(url, init);
  });
  const res = await shellFetch(`${apiBase}/api/request/jobs/get_jobs`, requestInit);
  expect(res.status).toBe(409);
  expect(server.fetch.mock.calls.filter(([url]) => url.includes('/api/request/'))).toHaveLength(2);
});

test('a 409 the shell cannot sync for goes to the core', async () => {
  const { server, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-1' });
  const serve = server.fetch.getMockImplementation();
  server.fetch.mockImplementation(async (url, init) => {
    if (url.includes('/api/mobile/root')) throw new TypeError('Network request failed');
    return serve(url, init);
  });
  const res = await shellFetch(`${apiBase}/api/request/jobs/get_jobs`, requestInit);
  expect(res.status).toBe(409);
});

test('a call without a build stamp (an endpoint call) is never retried', async () => {
  const { server, shellFetch } = await setup();
  deploy({ server, todayHash: 'h-today-1' });
  server.fetch.mockClear();
  const res = await shellFetch(`${apiBase}/api/endpoints/save`, { method: 'POST', headers: {} });
  expect(res.status).toBe(404);
  expect(server.fetch).toHaveBeenCalledTimes(1);
  expect(header(server.fetch.mock.calls[0][1], 'x-lowdefy-build')).toBeNull();
});
