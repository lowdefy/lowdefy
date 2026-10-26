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

import createAppSession from './createAppSession.js';
import createFakeServer, { header } from '../test/createFakeServer.js';
import createMemoryCacheStore from '../test/createMemoryCacheStore.js';
import createMemoryStore from '../host/createMemoryStore.js';
import { createPages, createRoot } from '../test/fixtures.js';

const apiBase = 'https://field.example.com';
const app = { id: 'field', name: 'Field', urls: { production: apiBase } };

function createServer(overrides = {}) {
  return createFakeServer({
    caller: 'c-anon; roles=r0',
    root: createRoot(),
    rootEtag: '"root-1"',
    pages: createPages([
      ['today', 'today', '"p-today-1"'],
      ['jobs', 'jobs', '"p-jobs-1"'],
      ['jobs/{job_id}', 'job', '"p-job-1"'],
    ]),
    ...overrides,
  });
}

function createSession({
  server,
  cacheStore = createMemoryCacheStore(),
  kv = createMemoryStore(),
}) {
  const tokenStore = { get: () => 'token-1' };
  const session = createAppSession({
    apiBase,
    app,
    cacheStore,
    fetch: server.fetch,
    kv,
    tokenStore,
  });
  return { cacheStore, kv, session };
}

function callsTo(server, pathname) {
  return server.fetch.mock.calls.filter(([url]) => new URL(url).pathname === pathname);
}

test('a first start fetches the root, the user and every page in the index', async () => {
  const server = createServer({ user: { id: 'u1' } });
  const { session } = createSession({ server });
  expect(session.getState().status).toBe('loading');
  await session.start();
  const state = session.getState();
  expect(state.status).toBe('ready');
  expect(state.user).toEqual({ id: 'u1' });
  expect(state.buildId).toBe('build-1');
  expect(Object.keys(state.pages).sort()).toEqual(['job', 'jobs', 'today']);
  expect(state.pages.job).toEqual(
    expect.objectContaining({ hash: 'h-job-1', etag: '"p-job-1"', buildId: 'build-1' })
  );
  expect(state.rootConfig.pagePaths).toEqual({
    today: 'today',
    jobs: 'jobs',
    job: 'jobs/{job_id}',
  });
  expect(callsTo(server, '/api/page/jobs/%7Bjob_id%7D')).toHaveLength(1);
});

test('every shell call carries the session token as a bearer token', async () => {
  const server = createServer();
  const { session } = createSession({ server });
  await session.start();
  server.fetch.mock.calls.forEach(([, init]) => {
    expect(header(init, 'Authorization')).toBe('Bearer token-1');
  });
});

test('pages are fetched at most 4 at a time', async () => {
  const pageIndex = Array.from({ length: 10 }, (_, i) => ({
    path: `p${i}`,
    pageId: `p${i}`,
    hash: `h${i}`,
    typesKey: 'carried',
  }));
  const server = createServer({
    root: createRoot({ pageIndex }),
    pages: createPages(pageIndex.map((entry) => [entry.path, entry.pageId, `"${entry.hash}"`])),
  });
  let inFlight = 0;
  let most = 0;
  const serve = server.fetch.getMockImplementation();
  server.fetch.mockImplementation(async (url, init) => {
    inFlight += 1;
    most = Math.max(most, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;
    return serve(url, init);
  });
  const { session } = createSession({ server });
  await session.start();
  expect(Object.keys(session.getState().pages)).toHaveLength(10);
  expect(most).toBeLessThanOrEqual(4);
});

describe('cache keying', () => {
  test('the cache is kept per app, caller and roles', async () => {
    const server = createServer({ caller: 'c-ada; session=s1; roles=r-staff' });
    const { cacheStore, session } = createSession({ server });
    await session.start();
    expect(session.getState().cacheKey).toBe('field:c-ada:r-staff');
    expect([...cacheStore.roots.keys()]).toEqual(['field:c-ada:r-staff']);
    expect([...cacheStore.pages.get('field:c-ada:r-staff').keys()].sort()).toEqual([
      'job',
      'jobs',
      'today',
    ]);
  });

  test('a start renders the last cache at once, before the server answers', async () => {
    const server = createServer({ caller: 'c-ada; roles=r-staff' });
    const cacheStore = createMemoryCacheStore();
    const kv = createMemoryStore();
    await createSession({ server, cacheStore, kv }).session.start();

    let answer;
    const offline = { fetch: jest.fn(() => new Promise((resolve) => (answer = resolve))) };
    const { session } = createSession({ server: offline, cacheStore, kv });
    const started = session.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const state = session.getState();
    expect(state.status).toBe('ready');
    expect(state.cacheKey).toBe('field:c-ada:r-staff');
    expect(Object.keys(state.pages).sort()).toEqual(['job', 'jobs', 'today']);
    expect(offline.fetch).toHaveBeenCalled();
    answer(Promise.reject(new Error('Network request failed')));
    await started;
  });

  test('with no signal the app keeps its cached pages', async () => {
    const server = createServer();
    const cacheStore = createMemoryCacheStore();
    const kv = createMemoryStore();
    await createSession({ server, cacheStore, kv }).session.start();
    const offline = {
      fetch: jest.fn(async () => Promise.reject(new TypeError('Network request failed'))),
    };
    const { session } = createSession({ server: offline, cacheStore, kv });
    await session.start();
    expect(session.getState().status).toBe('ready');
    expect(Object.keys(session.getState().pages)).toHaveLength(3);
  });

  test('with no signal and no cache the app shows the error', async () => {
    const offline = {
      fetch: jest.fn(async () => Promise.reject(new TypeError('Network request failed'))),
    };
    const { session } = createSession({ server: offline });
    await session.start();
    expect(session.getState().status).toBe('error');
    expect(session.getState().error.message).toBe('Network request failed');
  });

  test('an app without mobile pages shows an error', async () => {
    const server = createServer();
    server.fetch.mockImplementation(async () => ({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({}),
    }));
    const { session } = createSession({ server });
    await session.start();
    expect(session.getState().error.message).toBe('This app has no mobile pages.');
  });
});

describe('ETag reuse', () => {
  test('a sync revalidates the root with its ETag and keeps it on a 304', async () => {
    const server = createServer();
    const { session } = createSession({ server });
    await session.start();
    const { root, rootConfig } = session.getState();
    server.fetch.mockClear();
    await session.sync();
    const [rootCall] = callsTo(server, '/api/mobile/root');
    expect(header(rootCall[1], 'If-None-Match')).toBe('"root-1"');
    expect(session.getState().root).toBe(root);
    expect(session.getState().rootConfig).toBe(rootConfig);
    expect(server.fetch.mock.calls.filter(([url]) => url.includes('/api/page/'))).toHaveLength(0);
  });

  test('only pages whose hash changed are fetched again, revalidated with their ETag', async () => {
    const server = createServer();
    const { session } = createSession({ server });
    await session.start();
    const before = session.getState().pages;
    server.state.root = createRoot({
      buildId: 'build-2',
      pageIndex: [
        { path: 'today', pageId: 'today', hash: 'h-today-2', typesKey: 'carried' },
        { path: 'jobs', pageId: 'jobs', hash: 'h-jobs-1', typesKey: 'carried' },
      ],
    });
    server.state.rootEtag = '"root-2"';
    server.state.pages.today = {
      pageConfig: { ...before.today.pageConfig, v: 2 },
      etag: '"p-today-2"',
    };
    server.fetch.mockClear();
    await session.sync();
    const pageCalls = server.fetch.mock.calls.filter(([url]) => url.includes('/api/page/'));
    expect(pageCalls.map(([url]) => url)).toEqual([`${apiBase}/api/page/today`]);
    expect(header(pageCalls[0][1], 'If-None-Match')).toBe('"p-today-1"');
    const state = session.getState();
    expect(state.buildId).toBe('build-2');
    expect(state.pages.today.pageConfig.v).toBe(2);
    expect(state.pages.jobs).toBe(before.jobs);
    expect(state.pages.job).toBeUndefined();
  });

  test('a page answered with a 304 is kept under its new hash', async () => {
    const server = createServer();
    const { session } = createSession({ server });
    await session.start();
    server.state.root = createRoot({
      pageIndex: [{ path: 'today', pageId: 'today', hash: 'h-today-2', typesKey: 'carried' }],
    });
    server.state.rootEtag = '"root-2"';
    await session.sync();
    expect(session.getState().pages.today.hash).toBe('h-today-2');
    expect(session.getState().pages.today.etag).toBe('"p-today-1"');
  });
});

describe('caller changes', () => {
  test("a root answered as another caller resets the app onto that caller's cache", async () => {
    const server = createServer({ caller: 'c-ada; roles=r-staff' });
    const { cacheStore, session } = createSession({ server });
    await session.start();
    const { generation, homeRequests, lowdefy } = session.getState();
    server.state.caller = 'c-ben; roles=r-admin';
    server.state.root = createRoot({
      pageIndex: [{ path: 'today', pageId: 'today', hash: 'h-today-admin', typesKey: 'carried' }],
    });
    server.state.rootEtag = '"root-admin"';
    await session.sync();
    const state = session.getState();
    expect(state.cacheKey).toBe('field:c-ben:r-admin');
    expect(state.generation).toBe(generation + 1);
    expect(state.homeRequests).toBe(homeRequests + 1);
    expect(state.lowdefy).not.toBe(lowdefy);
    expect(Object.keys(state.pages)).toEqual(['today']);
    expect(state.pages.today.hash).toBe('h-today-admin');
    // The first caller's cache is kept for when they come back.
    expect([...cacheStore.roots.keys()].sort()).toEqual([
      'field:c-ada:r-staff',
      'field:c-ben:r-admin',
    ]);
    expect(session.takeHomeRequest()).toBe(true);
    expect(session.takeHomeRequest()).toBe(false);
  });

  test('onCallerChanged drops the screens, refetches the root under the new key and goes home', async () => {
    const server = createServer({ caller: 'c-ada; roles=r-staff' });
    const { session } = createSession({ server });
    await session.start();
    const before = session.getState();
    const statuses = [];
    session.subscribe(() => statuses.push(session.getState().status));
    server.state.caller = 'c-anon; roles=r0';
    const reset = session.handleCallerChanged();
    expect(session.getState().status).toBe('loading');
    await reset;
    const state = session.getState();
    expect(statuses[0]).toBe('loading');
    expect(state.status).toBe('ready');
    expect(state.cacheKey).toBe('field:c-anon:r0');
    expect(state.generation).toBeGreaterThan(before.generation);
    expect(state.homeRequests).toBeGreaterThan(before.homeRequests);
    expect(session.takeHomeRequest()).toBe(true);
  });
});

test('onBuildChanged syncs and rebuilds every screen on the new build', async () => {
  const server = createServer();
  const { session } = createSession({ server });
  await session.start();
  const before = session.getState();
  server.state.root = createRoot({ buildId: 'build-2' });
  server.state.rootEtag = '"root-2"';
  await session.handleBuildChanged();
  const state = session.getState();
  expect(state.buildId).toBe('build-2');
  expect(state.generation).toBe(before.generation + 1);
  expect(state.lowdefy).toEqual({ buildId: 'build-2' });
  expect(state.homeRequests).toBe(before.homeRequests);
});

describe('loadPage', () => {
  test('a cached page with a hash is not fetched again on a visit', async () => {
    const server = createServer();
    const { session } = createSession({ server });
    await session.start();
    server.fetch.mockClear();
    const entry = session.getState().root.pageIndex[0];
    await session.loadPage({ entry, path: 'today' });
    expect(server.fetch).not.toHaveBeenCalled();
  });

  test('a dev page (no hash) is fetched on every visit by its path', async () => {
    const pageIndex = [{ path: 'jobs/{job_id}', pageId: 'job' }];
    const server = createServer({
      root: createRoot({ pageIndex, typeSets: {} }),
      pages: createPages([['jobs/7', 'job', '"dev-1"']]),
    });
    const { session } = createSession({ server });
    await session.start();
    expect(session.getState().pages).toEqual({});
    await session.loadPage({ entry: pageIndex[0], path: 'jobs/7' });
    await session.loadPage({ entry: pageIndex[0], path: 'jobs/7' });
    const pageCalls = callsTo(server, '/api/page/jobs/7');
    expect(pageCalls).toHaveLength(2);
    expect(header(pageCalls[1][1], 'If-None-Match')).toBe('"dev-1"');
    expect(session.getState().pages.job.pageConfig.pageId).toBe('job');
  });

  test('a dynamic page is fetched on every visit', async () => {
    const server = createServer();
    server.state.pages.today.pageConfig.dynamic = true;
    const { session } = createSession({ server });
    await session.start();
    server.fetch.mockClear();
    await session.loadPage({ entry: session.getState().root.pageIndex[0], path: 'today' });
    expect(callsTo(server, '/api/page/today')).toHaveLength(1);
  });
});

test('fetchOtherPage reports a web page for the shell to open in the browser', async () => {
  const server = createServer({ otherSurfaces: { reports: { pageConfig: null, surface: 'web' } } });
  const { session } = createSession({ server });
  await session.start();
  expect(await session.fetchOtherPage('reports')).toEqual({ notFound: true, surface: 'web' });
  expect(await session.fetchOtherPage('nothing')).toEqual({ notFound: true, surface: null });
});
