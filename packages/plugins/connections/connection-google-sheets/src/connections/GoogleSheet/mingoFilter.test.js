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

import mingoFilter from './mingoFilter.js';

test('mingoFilter equals shorthand', () => {
  const filter = { id: 1 };
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  const res = mingoFilter({ input, filter });
  expect(res).toEqual([
    {
      id: 1,
      x: 'x',
    },
  ]);
});

test('mingoFilter greater than', () => {
  const filter = { id: { $gt: 1 } };
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  const res = mingoFilter({ input, filter });
  expect(res).toEqual([
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ]);
});

test('mingoFilter $in', () => {
  const filter = { id: { $in: [1, 3] } };
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  const res = mingoFilter({ input, filter });
  expect(res).toEqual([
    {
      id: 1,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ]);
});

test('mingoFilter filter empty object', () => {
  const filter = {};
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  const res = mingoFilter({ input, filter });
  expect(res).toEqual([
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ]);
});

test('mingoFilter filter undefined', () => {
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  const res = mingoFilter({ input });
  expect(res).toEqual([
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ]);
});

test('mingoFilter input empty array', () => {
  const filter = { id: 1 };
  const input = [];
  const res = mingoFilter({ input, filter });
  expect(res).toEqual([]);
});

test('mingoFilter input undefined', () => {
  const filter = { id: 1 };
  const res = mingoFilter({ filter });
  expect(res).toEqual([]);
});

test('mingoFilter filter not an object', () => {
  const filter = 'filter';
  const input = [
    {
      id: 1,
      x: 'x',
    },
    {
      id: 2,
      x: 'x',
    },
    {
      id: 3,
      x: 'x',
    },
  ];
  expect(() => mingoFilter({ input, filter })).toThrow(
    'Mingo filter error. Argument "filter" should be an object.'
  );
});

test('mingoFilter input not an array', () => {
  const filter = { id: 1 };
  const input = 'input';
  expect(() => mingoFilter({ input, filter })).toThrow(
    'Mingo filter error. Argument "input" should be an array.'
  );
});
