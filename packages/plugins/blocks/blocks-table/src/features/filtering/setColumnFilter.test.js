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

import getColumnConditions from './getColumnConditions.js';
import setColumnFilter from './setColumnFilter.js';

const stage = { key: 'stage', op: 'in', value: ['won'] };
const owner = { key: 'owner', op: 'eq', value: 'Ada' };
const mixed = { or: [{ key: 'stage', op: 'eq', value: 'lost' }, owner] };

test('setColumnFilter adds a column condition to an empty filter under a top-level and', () => {
  expect(setColumnFilter({ filter: null, key: 'stage', condition: stage })).toEqual({
    and: [stage],
  });
});

test('setColumnFilter replaces the column conditions in place and keeps the others', () => {
  const filter = { and: [stage, owner, { key: 'stage', op: 'notEmpty' }] };
  const next = { key: 'stage', op: 'in', value: ['lost'] };
  expect(setColumnFilter({ filter, key: 'stage', condition: next })).toEqual({
    and: [next, owner],
  });
});

test('setColumnFilter keeps conditions that mix columns', () => {
  const filter = { and: [mixed, stage] };
  expect(setColumnFilter({ filter, key: 'stage', condition: null })).toEqual({ and: [mixed] });
});

test('setColumnFilter spreads an and group and keeps an or group whole', () => {
  const a = { key: 'amount', op: 'gt', value: 1 };
  const b = { key: 'amount', op: 'lt', value: 9 };
  expect(setColumnFilter({ filter: null, key: 'amount', condition: { and: [a, b] } })).toEqual({
    and: [a, b],
  });
  expect(setColumnFilter({ filter: null, key: 'amount', condition: { or: [a, b] } })).toEqual({
    and: [{ or: [a, b] }],
  });
});

test('setColumnFilter returns null when no conditions are left', () => {
  expect(setColumnFilter({ filter: { and: [stage] }, key: 'stage', condition: null })).toBe(null);
});

test('setColumnFilter treats a leaf or or filter as one top-level condition', () => {
  expect(setColumnFilter({ filter: owner, key: 'stage', condition: stage })).toEqual({
    and: [owner, stage],
  });
  expect(setColumnFilter({ filter: stage, key: 'stage', condition: null })).toBe(null);
});

test('getColumnConditions returns the top-level conditions of one column only', () => {
  const filter = { and: [stage, owner, mixed, { and: [{ key: 'stage', op: 'empty' }] }] };
  expect(getColumnConditions({ filter, key: 'stage' })).toEqual([
    stage,
    { and: [{ key: 'stage', op: 'empty' }] },
  ]);
  expect(getColumnConditions({ filter: null, key: 'stage' })).toEqual([]);
});
