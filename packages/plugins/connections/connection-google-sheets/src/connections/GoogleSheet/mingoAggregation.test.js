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

import mingoAggregation from './mingoAggregation.js';

test('mingoAggregation sort', () => {
  const pipeline = [
    {
      $sort: {
        id: 1,
      },
    },
  ];
  const input = [
    {
      id: 2,
    },
    {
      id: 1,
    },
  ];
  const res = mingoAggregation({ input, pipeline });
  expect(res).toEqual([
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);
});

test('mingoAggregation group', () => {
  const pipeline = [
    {
      $group: {
        _id: 0,
        count: { $sum: 1 },
      },
    },
  ];
  const input = [
    {
      id: 2,
    },
    {
      id: 1,
    },
  ];
  const res = mingoAggregation({ input, pipeline });
  expect(res).toEqual([
    {
      _id: 0,
      count: 2,
    },
  ]);
});

test('mingoAggregation empty pipeline', () => {
  const pipeline = [];
  const input = [
    {
      id: 2,
    },
    {
      id: 1,
    },
  ];
  const res = mingoAggregation({ input, pipeline });
  expect(res).toEqual([
    {
      id: 2,
    },
    {
      id: 1,
    },
  ]);
});

test('mingoAggregation undefined pipeline', () => {
  const input = [
    {
      id: 2,
    },
    {
      id: 1,
    },
  ];
  const res = mingoAggregation({ input });
  expect(res).toEqual([
    {
      id: 2,
    },
    {
      id: 1,
    },
  ]);
});

test('mingoAggregation empty input', () => {
  const pipeline = [
    {
      $sort: {
        id: 1,
      },
    },
  ];
  const input = [];
  const res = mingoAggregation({ input, pipeline });
  expect(res).toEqual([]);
});

test('mingoAggregation undefined input', () => {
  const pipeline = [
    {
      $sort: {
        id: 1,
      },
    },
  ];
  const res = mingoAggregation({ pipeline });
  expect(res).toEqual([]);
});

test('mingoAggregation pipeline is not an array', () => {
  const pipeline = 'pipeline';
  const input = [
    {
      id: 2,
    },
    {
      id: 1,
    },
  ];
  expect(() => mingoAggregation({ input, pipeline })).toThrow(
    'Mingo aggregation error. Argument "pipeline" should be an array.'
  );
});

test('mingoAggregation input is not an array', () => {
  const pipeline = [
    {
      $sort: {
        id: 1,
      },
    },
  ];
  const input = 'input';
  expect(() => mingoAggregation({ input, pipeline })).toThrow(
    'Mingo aggregation error. Argument "input" should be an array.'
  );
});
