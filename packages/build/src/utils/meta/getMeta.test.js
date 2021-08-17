/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createFetchMetaCache from './fetchMetaCache';
import createWriteMetaCache from './writeMetaCache';
import fetchMetaUrl from './fetchMetaUrl';
// eslint-disable-next-line no-unused-vars
import metaLocations from './metaLocations';

// TODO: test memoised
jest.mock('./fetchMetaCache', () => {
  const mockFetchMetaCache = jest.fn();
  return () => mockFetchMetaCache;
});
jest.mock('./writeMetaCache', () => {
  const mockWriteMetaCache = jest.fn();
  return () => mockWriteMetaCache;
});
jest.mock('./fetchMetaUrl', () => {
  const mockFetchMetaUrl = jest.fn();
  return mockFetchMetaUrl;
});

jest.mock('./metaLocations', () => {
  const mockMetaLocations = jest.fn(() => ({
    DefaultType: {
      url: 'defaultTypeUrl',
    },
  }));
  return mockMetaLocations;
});

const mockFetchMetaCache = createFetchMetaCache();
const mockWriteMetaCache = createWriteMetaCache();
const mockFetchMetaUrl = fetchMetaUrl;

const types = {
  Type1: {
    url: 'type1Url',
  },
  Type2: {
    url: 'type2Url',
  },
  Localhost: {
    url: 'http://localhost:3003/meta/Block.json',
  },
};

const defaultMeta = {
  category: 'input',
  moduleFederation: {
    module: 'Module',
    scope: 'scope',
    version: '1.0.0',
    remoteEntryUrl: `http://localhost:3002/remoteEntry.js`,
  },
};

beforeEach(() => {
  mockFetchMetaCache.mockReset();
  mockWriteMetaCache.mockReset();
  mockFetchMetaUrl.mockReset();
});

test('getMeta cache returns from cache', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaCache.mockImplementation((location) => {
    if (location && location.url === 'type1Url') {
      return defaultMeta;
    }
    return null;
  });
  const res = await getMeta('Type1');
  expect(res).toEqual({
    type: 'Type1',
    meta: defaultMeta,
  });
});

test('getMeta fetches from url and writes to cache', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaUrl.mockImplementation(({ location }) => {
    if (location && location.url === 'type1Url') {
      return defaultMeta;
    }
    return null;
  });
  const res = await getMeta('Type1');
  expect(res).toEqual({
    type: 'Type1',
    meta: defaultMeta,
  });
  expect(mockWriteMetaCache.mock.calls).toEqual([
    [
      {
        location: {
          url: 'type1Url',
        },
        meta: defaultMeta,
      },
    ],
  ]);
});

test('getMeta uses locations from metaLocations', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaCache.mockImplementation((location) => {
    if (location && location.url === 'defaultTypeUrl') {
      return defaultMeta;
    }
    return null;
  });
  const res = await getMeta('DefaultType');
  expect(res).toEqual({
    type: 'DefaultType',
    meta: defaultMeta,
  });
});

test('getMeta type not in types', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  await expect(getMeta('Undefined')).rejects.toThrow(
    'Block type "Undefined" is not defined. Specify type url in types array.'
  );
});

test('getMeta undefined type', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  await expect(getMeta()).rejects.toThrow(
    'Block type undefined is not defined. Specify type url in types array.'
  );
});

test('getMeta meta not found in cache or url', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  await expect(getMeta('Type2')).rejects.toThrow(
    'Block type "Type2" has invalid block meta at {"url":"type2Url"}.'
  );
});

test('getMeta invalid meta', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaUrl.mockImplementation(() => ({ invalidMeta: true }));
  await expect(getMeta('Type2')).rejects.toThrow(
    'Block type "Type2" has invalid block meta at {"url":"type2Url"}.'
  );
});

test('getMeta fetches from url and writes to cache', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaUrl.mockImplementation(({ location }) => {
    if (location && location.url === 'http://localhost:3003/meta/Block.json') {
      return defaultMeta;
    }
    return null;
  });
  const res = await getMeta('Localhost');
  expect(res).toEqual({
    type: 'Localhost',
    meta: defaultMeta,
  });
  expect(mockFetchMetaCache.mock.calls).toEqual([]);
  expect(mockWriteMetaCache.mock.calls).toEqual([]);
});

test('getMeta meta is memoised when returned from cache', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaCache.mockImplementation((location) => {
    if (location && location.url === 'defaultTypeUrl') {
      return defaultMeta;
    }
    return null;
  });
  await getMeta('DefaultType');
  await getMeta('DefaultType');
  expect(mockFetchMetaCache.mock.calls).toEqual([
    [
      {
        url: 'defaultTypeUrl',
      },
    ],
  ]);
});

test('getMeta meta is memoised when returned from cache', async () => {
  let createGetMeta;
  jest.isolateModules(() => {
    createGetMeta = require('./getMeta').default;
  });
  const getMeta = createGetMeta({ types, cacheDirectory: 'cacheDirectory' });
  mockFetchMetaUrl.mockImplementation(({ location }) => {
    if (location && location.url === 'defaultTypeUrl') {
      return defaultMeta;
    }
    return null;
  });
  await getMeta('DefaultType');
  await getMeta('DefaultType');
  expect(mockFetchMetaCache.mock.calls).toEqual([
    [
      {
        url: 'defaultTypeUrl',
      },
    ],
  ]);
  expect(mockFetchMetaUrl.mock.calls).toEqual([
    [
      {
        location: {
          url: 'defaultTypeUrl',
        },
        type: 'DefaultType',
      },
    ],
  ]);
});
