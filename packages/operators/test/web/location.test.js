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

import location from '../../src/web/location';
import getFromObject from '../../src/getFromObject';

jest.mock('../../src/getFromObject');

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: {
      hash: '#XYZ',
      homePageId: 'home',
      host: 'localhost:3000',
      hostname: 'localhost',
      href: 'http://localhost:3000/details?_id=%22ABCD%22#XYZ',
      origin: 'http://localhost:3000',
      pageId: 'page-one',
      pathname: '/details',
      port: '3000',
      protocol: 'http:',
      search: '?_id=%22ABCD%22',
    },
  });
});

const input = {
  arrayIndices: [0],
  context: { context: true, lowdefy: { basePath: 'base' } },
  contexts: { contexts: true },
  env: 'env',
  location: 'location',
  lowdefyGlobal: { lowdefyGlobal: true },
  params: 'origin',
};

test('location calls getFromObject', () => {
  location(input);
  expect(getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        context: {
          context: true,
          lowdefy: { basePath: 'base' },
        },
        contexts: {
          contexts: true,
        },
        env: 'env',
        location: 'location',
        object: {
          basePath: 'base',
          hash: '#XYZ',
          homePageId: 'home',
          host: 'localhost:3000',
          hostname: 'localhost',
          href: 'http://localhost:3000/details?_id=%22ABCD%22#XYZ',
          origin: 'http://localhost:3000',
          pathname: '/details',
          pageId: 'page-one',
          port: '3000',
          protocol: 'http:',
          search: '?_id=%22ABCD%22',
        },
        operator: '_location',
        params: 'origin',
      },
    ],
  ]);
});

test('_location throw on no location', () => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: undefined,
  });
  expect(() => location({ params: 'origin', location: 'locationId' })).toThrow(
    'Operator Error: Browser window.location not available for _location. Received: "origin" at locationId.'
  );
});

test('_location throw invalid param', () => {
  expect(() => location({ ...input, params: 'none' })).toThrow(
    'Operator Error: _location only returns values for basePath, href, origin, protocol, host, hostname, port, pathname, search, hash. Received: "none" at location.'
  );
});
