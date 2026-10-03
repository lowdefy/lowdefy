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

// usePageConfig imports swr and useMutateCache only for the hook; the fetcher
// under test needs neither. Mock them so the module loads in the node test env.
jest.unstable_mockModule('swr', () => ({ default: jest.fn() }));
jest.unstable_mockModule('./useMutateCache.js', () => ({
  getNavVersion: jest.fn(),
  getReloadVersion: jest.fn(),
}));

const { getNavVersion, getReloadVersion } = await import('./useMutateCache.js');
const { fetchPageConfig, getPageConfigKey, recordDynamicPage } = await import('./usePageConfig.js');

beforeEach(() => {
  getNavVersion.mockReturnValue(0);
  getReloadVersion.mockReturnValue(0);
});

function mockJsonResponse(body) {
  return { status: 200, ok: true, json: async () => body };
}

afterEach(() => {
  delete global.fetch;
});

test('fetchPageConfig compiles inlined _jsEntries module text into a { hash: fn } object', async () => {
  global.fetch = jest.fn(async () =>
    mockJsonResponse({
      id: 'p',
      _jsEntries: "export default { 'h1': ({ args }) => { return args.x + 1; } };",
      _dynamicIcons: { Zap: { node: [['path', { d: 'M0 0' }]] } },
    })
  );

  const data = await fetchPageConfig('http://localhost/api/page/p');

  expect(typeof data._jsEntries.h1).toBe('function');
  expect(data._jsEntries.h1({ args: { x: 1 } })).toBe(2);
  // _dynamicIcons passes through untouched.
  expect(data._dynamicIcons).toEqual({ Zap: { node: [['path', { d: 'M0 0' }]] } });
});

test('fetchPageConfig issues only the page-config request — no /api/js or /api/icons fetch', async () => {
  global.fetch = jest.fn(async () => mockJsonResponse({ id: 'p' }));

  const data = await fetchPageConfig('http://localhost/api/page/p');

  expect(data._jsEntries).toBeUndefined();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][0]).toBe('http://localhost/api/page/p');
});

test('getPageConfigKey leaves the query string out of a page not known to be dynamic', () => {
  const pageUrl = '/api/page/static-page';
  getNavVersion.mockReturnValue(1);
  const first = getPageConfigKey({ pageUrl, search: '?file=a' });
  getNavVersion.mockReturnValue(2);
  const second = getPageConfigKey({ pageUrl, search: '?file=b' });

  expect(first).toEqual([pageUrl, 0]);
  expect(second).toEqual(first);
});

test('getPageConfigKey keeps a static page keyed without the query after its fetch', () => {
  const pageUrl = '/api/page/static-fetched';
  recordDynamicPage({ data: { id: 'page:static-fetched' }, pageUrl });
  getNavVersion.mockReturnValue(3);

  expect(getPageConfigKey({ pageUrl, search: '?q=1' })).toEqual([pageUrl, 0]);
});

test('getPageConfigKey keeps the static key for the navigation that found a page dynamic', () => {
  const pageUrl = '/api/page/dynamic-first';
  getNavVersion.mockReturnValue(4);
  const beforeFetch = getPageConfigKey({ pageUrl, search: '?q=1' });
  recordDynamicPage({ data: { dynamic: true }, pageUrl });
  const afterFetch = getPageConfigKey({ pageUrl, search: '?q=1' });

  expect(afterFetch).toEqual(beforeFetch);
});

test('getPageConfigKey keys a known dynamic page on the query and navigation version', () => {
  const pageUrl = '/api/page/dynamic-later';
  getNavVersion.mockReturnValue(5);
  recordDynamicPage({ data: { dynamic: true }, pageUrl });
  getNavVersion.mockReturnValue(6);
  const sixth = getPageConfigKey({ pageUrl, search: '?q=1' });
  // A later fetch of the known dynamic page must not move it back to the static key.
  recordDynamicPage({ data: { dynamic: true }, pageUrl });
  const sixthAfterFetch = getPageConfigKey({ pageUrl, search: '?q=1' });
  getNavVersion.mockReturnValue(7);
  const seventh = getPageConfigKey({ pageUrl, search: '?q=1' });

  expect(sixth).toEqual([pageUrl, 0, '?q=1', 6]);
  expect(sixthAfterFetch).toEqual(sixth);
  expect(seventh).toEqual([pageUrl, 0, '?q=1', 7]);
});

test('getPageConfigKey returns to the static key when a dynamic page is no longer dynamic', () => {
  const pageUrl = '/api/page/dynamic-removed';
  getNavVersion.mockReturnValue(8);
  recordDynamicPage({ data: { dynamic: true }, pageUrl });
  getReloadVersion.mockReturnValue(1);
  getNavVersion.mockReturnValue(9);
  recordDynamicPage({ data: { id: 'page:dynamic-removed' }, pageUrl });

  expect(getPageConfigKey({ pageUrl, search: '?q=1' })).toEqual([pageUrl, 1]);
});
