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

test('_get calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const get = (await import('./get.js')).default;

  get({
    arrayIndices: [0],
    location: 'location',
    params: {
      from: { a: 1 },
      key: 'a',
    },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: { a: 1 },
        operator: '_get',
        params: {
          from: { a: 1 },
          key: 'a',
        },
      },
    ],
  ]);
});

test('_get returns null if from is null', async () => {
  const get = (await import('./get.js')).default;
  const input = {
    arrayIndices: [0],
    location: 'location',
    params: {
      from: null,
      key: 'a',
    },
  };
  expect(get(input)).toBe(null);
});

test('_get returns default value if from is null', async () => {
  const get = (await import('./get.js')).default;
  const input = {
    arrayIndices: [0],
    location: 'location',
    params: {
      from: null,
      key: 'a',
      default: 'default',
    },
  };
  expect(get(input)).toBe('default');
});

test('_get throws if params is not a object', async () => {
  const get = (await import('./get.js')).default;

  const input = {
    arrayIndices: [0],
    location: 'location',
    params: 'params',
  };
  expect(() => get(input)).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _get takes an object as params. Received: \\"params\\" at location."`
  );
});

test('_get throws if from is not a object, array or null', async () => {
  const get = (await import('./get.js')).default;

  const input = {
    arrayIndices: [0],
    location: 'location',
    params: {
      from: 1,
      key: 'a',
    },
  };
  expect(() => get(input)).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _get.from is not an object or array. Received: {\\"from\\":1,\\"key\\":\\"a\\"} at location."`
  );
});
