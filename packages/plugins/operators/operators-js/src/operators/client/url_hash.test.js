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

import { vi, expect, test } from 'vitest';

vi.doMock('@lowdefy/operators', () => ({
  getFromObject: vi.fn(),
}));

const globals = { window: { location: { hash: '#token=abc123&callbackURL=%2Fhome' } } };

test('url_hash calls getFromObject with the fragment parsed as a query string', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const url_hash = (await import('./url_hash.js')).default;
  url_hash({
    arrayIndices: [0],
    globals,
    location: 'location',
    params: 'params',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: { token: 'abc123', callbackURL: '/home' },
        operator: '_url_hash',
        params: 'params',
      },
    ],
  ]);
});

test('url_hash reads an empty fragment as an empty object', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  lowdefyOperators.getFromObject.mockClear();
  const url_hash = (await import('./url_hash.js')).default;
  url_hash({
    arrayIndices: [],
    globals: { window: { location: { hash: '' } } },
    location: 'location',
    params: 'token',
  });
  expect(lowdefyOperators.getFromObject.mock.calls[0][0].object).toEqual({});
});

test('url_hash throws without a window.location', async () => {
  const url_hash = (await import('./url_hash.js')).default;
  expect(() =>
    url_hash({
      arrayIndices: [0],
      globals: {},
      location: 'location',
      params: 'params',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Browser window.location not available for _url_hash.]`
  );
});
