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

import fetchPageConfig, { pageConfigKey } from './fetchPageConfig.js';

describe('pageConfigKey', () => {
  test('builds the api url without a basePath', () => {
    expect(pageConfigKey('', 'home')).toBe('/api/page/home');
  });

  test('builds the api url with a basePath', () => {
    expect(pageConfigKey('/admin', 'users')).toBe('/admin/api/page/users');
  });
});

describe('fetchPageConfig', () => {
  afterEach(() => {
    delete global.fetch;
  });

  test('returns parsed json when the response is ok', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ pageConfig: { id: 'page:home' } }) });
    await expect(fetchPageConfig('/api/page/home')).resolves.toEqual({
      pageConfig: { id: 'page:home' },
    });
  });

  test('returns { pageConfig: null } on a non-ok response so the caller routes to /404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(fetchPageConfig('/api/page/missing')).resolves.toEqual({ pageConfig: null });
  });

  test('rejects on a network failure so the caller falls back to a full page load', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    await expect(fetchPageConfig('/api/page/home')).rejects.toThrow('network down');
  });
});
