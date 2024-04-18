/*
  Copyright 2020-2024 Lowdefy, Inc

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

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

const window = {
  location: {
    hash: 'window.location.hash',
    host: 'window.location.host',
    hostname: 'window.location.hostname',
    href: 'window.location.href',
    origin: 'window.location.origin',
    pathname: 'window.location.pathname',
    port: 'window.location.port',
    protocol: 'window.location.protocol',
    search: 'window.location.search',
  },
};

const globals = { window };

const input = {
  arrayIndices: [0],
  basePath: 'base',
  home: {
    pageId: 'home-page-id',
  },
  location: 'location',
  pageId: 'page-id',
  params: 'origin',
  lowdefyGlobal: { lowdefyGlobal: true },
};

test('location calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const location = (await import('./location.js')).default;
  location({ ...input, globals });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: {
          basePath: 'base',
          homePageId: 'home-page-id',
          pageId: 'page-id',
          hash: 'window.location.hash',
          host: 'window.location.host',
          hostname: 'window.location.hostname',
          href: 'window.location.href',
          origin: 'window.location.origin',
          pathname: 'window.location.pathname',
          port: 'window.location.port',
          protocol: 'window.location.protocol',
          search: 'window.location.search',
        },
        operator: '_location',
        params: 'origin',
      },
    ],
  ]);
});

test('_location throw on no window', async () => {
  const location = (await import('./location.js')).default;
  expect(() => location({ ...input, globals: {} })).toThrow(
    'Operator Error: Browser window.location not available for _location. Received: "origin" at location.'
  );
});

test('_location throw on no location', async () => {
  const location = (await import('./location.js')).default;
  expect(() => location({ ...input, globals: { window: {} } })).toThrow(
    'Operator Error: Browser window.location not available for _location. Received: "origin" at location.'
  );
});

test('_location throw invalid param', async () => {
  const location = (await import('./location.js')).default;
  expect(() => location({ ...input, globals, params: 'invalid' })).toThrow(
    'Operator Error: _location only returns values for basePath, hash, homePageId, host, hostname, href, origin, pageId, pathname, port, protocol, search. Received: "invalid" at location.'
  );
});
