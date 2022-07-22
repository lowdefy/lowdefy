/*
  Copyright 2020-2022 Lowdefy, Inc

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
import get from './get.js';

jest.mock('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('_get calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  get({
    arrayIndices: [0],
    params: {
      from: { a: 1 },
      key: 'a',
    },
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
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

test('_get returns null if from is null', () => {
  const input = {
    arrayIndices: [0],
    params: {
      from: null,
      key: 'a',
    },
  };
  expect(get(input)).toBe(null);
});

test('_get returns default value if from is null', () => {
  const input = {
    arrayIndices: [0],
    params: {
      from: null,
      key: 'a',
      default: 'default',
    },
  };
  expect(get(input)).toBe('default');
});

test('_get throws if params is not a object', () => {
  const input = {
    arrayIndices: [0],
    params: 'params',
  };
  expect(() => get(input)).toThrowErrorMatchingInlineSnapshot(`"_get takes an object as params."`);
});

test('_get throws if from is not a object, array or null', () => {
  const input = {
    arrayIndices: [0],
    params: {
      from: 1,
      key: 'a',
    },
  };
  expect(() => get(input)).toThrowErrorMatchingInlineSnapshot(
    `"_get.from is not an object or array."`
  );
});
