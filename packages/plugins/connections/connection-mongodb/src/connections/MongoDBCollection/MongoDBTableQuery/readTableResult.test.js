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

import readTableResult from './readTableResult.js';

const specs = [
  { key: 'amount', fn: 'sum', name: 'a0' },
  { key: 'amount_avg', fn: 'avg', name: 'a1' },
  { key: 'name', fn: 'countDistinct', name: 'a2' },
];

test('readTableResult returns rows and total', () => {
  const result = [{ rows: [{ _id: 1 }, { _id: 2 }], total: [{ count: 12 }] }];
  expect(readTableResult({ result, grouped: false, specs: [] })).toEqual({
    rows: [{ _id: 1 }, { _id: 2 }],
    total: 12,
  });
});

test('readTableResult returns total 0 when nothing matched', () => {
  const result = [{ rows: [], total: [] }];
  expect(readTableResult({ result, grouped: false, specs: [] })).toEqual({ rows: [], total: 0 });
});

test('readTableResult maps groups and their aggregates to field keys', () => {
  const result = [
    {
      groups: [
        { _id: 'won', count: 3, a0: 30, a1: 10, a2: 2 },
        { _id: null, count: 1, a0: 0, a1: null, a2: 0 },
      ],
      total: [{ count: 2 }],
      aggregates: [{ _id: null, a0: 30, a1: 7.5, a2: 2 }],
    },
  ];
  expect(readTableResult({ result, grouped: true, specs })).toEqual({
    rows: [],
    total: 2,
    groups: [
      { key: 'won', count: 3, aggregates: { amount: 30, amount_avg: 10, name: 2 } },
      { key: null, count: 1, aggregates: { amount: 0, amount_avg: null, name: 0 } },
    ],
    aggregates: { amount: 30, amount_avg: 7.5, name: 2 },
  });
});

test('readTableResult returns empty aggregates when no rows matched', () => {
  const result = [{ rows: [], total: [], aggregates: [] }];
  expect(readTableResult({ result, grouped: false, specs })).toEqual({
    rows: [],
    total: 0,
    aggregates: { amount: 0, amount_avg: null, name: 0 },
  });
});

test('readTableResult groups have empty aggregates when none are requested', () => {
  const result = [{ groups: [{ _id: 'won', count: 3 }], total: [{ count: 1 }] }];
  expect(readTableResult({ result, grouped: true, specs: [] })).toEqual({
    rows: [],
    total: 1,
    groups: [{ key: 'won', count: 3, aggregates: {} }],
  });
});
