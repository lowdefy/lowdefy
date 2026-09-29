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

import buildColumnFilter from './buildColumnFilter.js';
import getFilterKind from './getFilterKind.js';
import parseColumnFilter from './parseColumnFilter.js';

test('getFilterKind picks the simple editor from the column type and options', () => {
  expect(getFilterKind({ type: 'text' })).toBe('text');
  expect(getFilterKind({ type: 'text', options: ['a'] })).toBe('options');
  expect(getFilterKind({ type: 'status' })).toBe('options');
  expect(getFilterKind({ type: 'tags' })).toBe('options');
  expect(getFilterKind({ type: 'currency' })).toBe('number');
  expect(getFilterKind({ type: 'datetime' })).toBe('date');
  expect(getFilterKind({ type: 'boolean' })).toBe('boolean');
  expect(getFilterKind({ type: 'json' })).toBe('presence');
});

test('parseColumnFilter and buildColumnFilter round-trip each simple editor', () => {
  const cases = [
    ['options', { key: 'k', op: 'in', value: ['a', 'b'] }],
    ['text', { key: 'k', op: 'startsWith', value: 'ac' }],
    ['text', { key: 'k', op: 'empty' }],
    ['number', { key: 'k', op: 'between', value: [1, 5] }],
    ['number', { key: 'k', op: 'gte', value: 1 }],
    ['number', { key: 'k', op: 'lte', value: 5 }],
    ['date', { key: 'k', op: 'between', value: ['2020-01-01', null] }],
    ['date', { key: 'k', op: 'within', value: { last: 7, unit: 'day' } }],
    ['boolean', { key: 'k', op: 'isTrue' }],
    ['presence', { key: 'k', op: 'notEmpty' }],
  ];
  cases.forEach(([kind, condition]) => {
    const state = parseColumnFilter({ kind, conditions: [condition] });
    expect(buildColumnFilter({ kind, key: 'k', state })).toEqual(condition);
  });
});

test('parseColumnFilter starts every editor empty and builds no filter from it', () => {
  ['options', 'text', 'number', 'date', 'boolean', 'presence'].forEach((kind) => {
    const state = parseColumnFilter({ kind, conditions: [] });
    expect(buildColumnFilter({ kind, key: 'k', state })).toBe(null);
  });
});

test('parseColumnFilter hands several conditions, groups and other operators to the builder', () => {
  const leaf = { key: 'k', op: 'gt', value: 1 };
  expect(parseColumnFilter({ kind: 'number', conditions: [leaf] })).toBe(null);
  expect(parseColumnFilter({ kind: 'number', conditions: [leaf, leaf] })).toBe(null);
  expect(parseColumnFilter({ kind: 'text', conditions: [{ or: [leaf] }] })).toBe(null);
});
