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

import assert from 'node:assert/strict';

import resolveAggregates from './resolveAggregates.js';

const columns = [
  { key: 'name' },
  { key: 'amount', aggregate: 'sum' },
  { key: 'margin', aggregate: 'avg' },
  { key: 'deals' },
];

test('resolveAggregates uses column defaults when the view sets none', () => {
  assert.deepEqual(resolveAggregates({ columns, aggregates: {} }), [
    { key: 'amount', fn: 'sum' },
    { key: 'margin', fn: 'avg' },
  ]);
});

test('resolveAggregates lets the view override, add and turn off aggregates, in column order', () => {
  assert.deepEqual(
    resolveAggregates({ columns, aggregates: { deals: 'count', amount: 'max', margin: null } }),
    [
      { key: 'amount', fn: 'max' },
      { key: 'deals', fn: 'count' },
    ]
  );
});
