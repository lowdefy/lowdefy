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

const { fetchPageConfig } = await import('./usePageConfig.js');

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
      _dynamicIcons: { FiZap: { tag: 'svg' } },
    })
  );

  const data = await fetchPageConfig('http://localhost/api/page/p');

  expect(typeof data._jsEntries.h1).toBe('function');
  expect(data._jsEntries.h1({ args: { x: 1 } })).toBe(2);
  // _dynamicIcons passes through untouched.
  expect(data._dynamicIcons).toEqual({ FiZap: { tag: 'svg' } });
});

test('fetchPageConfig issues only the page-config request — no /api/js or /api/icons fetch', async () => {
  global.fetch = jest.fn(async () => mockJsonResponse({ id: 'p' }));

  const data = await fetchPageConfig('http://localhost/api/page/p');

  expect(data._jsEntries).toBeUndefined();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][0]).toBe('http://localhost/api/page/p');
});
