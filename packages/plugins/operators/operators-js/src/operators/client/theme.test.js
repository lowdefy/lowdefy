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

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('_theme calls getFromObject with antd.token', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const _theme = (await import('./theme.js')).default;
  _theme({
    arrayIndices: [0],
    location: 'location',
    params: 'colorPrimary',
    theme: { antd: { token: { colorPrimary: '#00b96b' } } },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: { colorPrimary: '#00b96b' },
        operator: '_theme',
        params: 'colorPrimary',
      },
    ],
  ]);
});

test('_theme defaults to empty object when theme is undefined', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  lowdefyOperators.getFromObject.mockReset();
  const _theme = (await import('./theme.js')).default;
  _theme({
    arrayIndices: [],
    location: 'location',
    params: 'colorPrimary',
    theme: undefined,
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [],
        location: 'location',
        object: {},
        operator: '_theme',
        params: 'colorPrimary',
      },
    ],
  ]);
});

test('_theme defaults to empty object when antd.token is missing', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  lowdefyOperators.getFromObject.mockReset();
  const _theme = (await import('./theme.js')).default;
  _theme({
    arrayIndices: [],
    location: 'location',
    params: 'colorPrimary',
    theme: { antd: {} },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [],
        location: 'location',
        object: {},
        operator: '_theme',
        params: 'colorPrimary',
      },
    ],
  ]);
});
