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

import compileCondition from './compileCondition.js';
import normalizeColumns from './normalizeColumns.js';

const { columnsByKey } = normalizeColumns({
  columns: [
    { key: 'name' },
    { key: 'amount', type: 'currency' },
    { key: 'created', type: 'date' },
    { key: 'updated', type: 'datetime' },
    { key: 'active', type: 'boolean' },
    { key: 'labels', type: 'tags' },
    { key: 'owners', type: 'people' },
    { key: 'owner', field: 'owner.id' },
    { key: 'company', type: 'relation' },
  ],
});

const now = new Date('2026-03-15T12:00:00');

function matches(condition, row, options = {}) {
  return compileCondition({ condition, columnsByKey, now, ...options })(row, options.value);
}

test('compileCondition eq and ne compare text without case', () => {
  expect(matches({ key: 'name', op: 'eq', value: 'acme' }, { name: 'ACME' })).toBe(true);
  expect(matches({ key: 'name', op: 'eq', value: 'acme' }, { name: 'Acme Ltd' })).toBe(false);
  expect(matches({ key: 'name', op: 'ne', value: 'acme' }, { name: 'Acme Ltd' })).toBe(true);
});

test('compileCondition eq matches empty against empty', () => {
  expect(matches({ key: 'name', op: 'eq', value: null }, {})).toBe(true);
  expect(matches({ key: 'name', op: 'eq', value: 'a' }, {})).toBe(false);
});

test('compileCondition eq compares numbers numerically', () => {
  expect(matches({ key: 'amount', op: 'eq', value: 10 }, { amount: '10' })).toBe(true);
  expect(matches({ key: 'amount', op: 'eq', value: 10 }, { amount: 10.5 })).toBe(false);
});

test('compileCondition eq on a date column compares by day', () => {
  const row = { created: '2026-03-01T18:30:00', updated: '2026-03-01T18:30:00' };
  expect(matches({ key: 'created', op: 'eq', value: '2026-03-01' }, row)).toBe(true);
  expect(matches({ key: 'updated', op: 'eq', value: '2026-03-01' }, row)).toBe(true);
  expect(matches({ key: 'created', op: 'eq', value: '2026-03-02' }, row)).toBe(false);
});

test('compileCondition in and nin test membership without case', () => {
  expect(matches({ key: 'name', op: 'in', value: ['acme', 'globex'] }, { name: 'Globex' })).toBe(
    true
  );
  expect(matches({ key: 'name', op: 'in', value: ['acme'] }, { name: 'Initech' })).toBe(false);
  expect(matches({ key: 'name', op: 'nin', value: ['acme'] }, { name: 'Initech' })).toBe(true);
  expect(matches({ key: 'name', op: 'in', value: [] }, { name: 'Initech' })).toBe(false);
});

test('compileCondition in and nin on arrays mean any of and none of', () => {
  const row = { labels: ['vip', 'new'] };
  expect(matches({ key: 'labels', op: 'in', value: ['old', 'VIP'] }, row)).toBe(true);
  expect(matches({ key: 'labels', op: 'in', value: ['old'] }, row)).toBe(false);
  expect(matches({ key: 'labels', op: 'nin', value: ['old'] }, row)).toBe(true);
  expect(matches({ key: 'labels', op: 'nin', value: ['new'] }, row)).toBe(false);
});

test('compileCondition matches records in arrays by their id', () => {
  const row = {
    owners: [
      { _id: 'u1', name: 'Ann' },
      { _id: 'u2', name: 'Bob' },
    ],
  };
  expect(matches({ key: 'owners', op: 'in', value: ['u2'] }, row)).toBe(true);
  expect(matches({ key: 'owners', op: 'contains', value: 'u1' }, row)).toBe(true);
  expect(matches({ key: 'owners', op: 'contains', value: 'ann' }, row)).toBe(true);
  expect(matches({ key: 'owners', op: 'notContains', value: 'u3' }, row)).toBe(true);
});

test('compileCondition empty and notEmpty treat null, undefined, empty string and [] as empty', () => {
  [{}, { name: null }, { name: '' }, { name: [] }].forEach((row) => {
    expect(matches({ key: 'name', op: 'empty' }, row)).toBe(true);
    expect(matches({ key: 'name', op: 'notEmpty' }, row)).toBe(false);
  });
  expect(matches({ key: 'name', op: 'empty' }, { name: 0 })).toBe(false);
  expect(matches({ key: 'name', op: 'notEmpty' }, { name: false })).toBe(true);
});

test('compileCondition contains, notContains, startsWith and endsWith ignore case', () => {
  const row = { name: 'Acme Holdings' };
  expect(matches({ key: 'name', op: 'contains', value: 'HOLD' }, row)).toBe(true);
  expect(matches({ key: 'name', op: 'contains', value: 'corp' }, row)).toBe(false);
  expect(matches({ key: 'name', op: 'notContains', value: 'corp' }, row)).toBe(true);
  expect(matches({ key: 'name', op: 'startsWith', value: 'acme' }, row)).toBe(true);
  expect(matches({ key: 'name', op: 'startsWith', value: 'holdings' }, row)).toBe(false);
  expect(matches({ key: 'name', op: 'endsWith', value: 'HOLDINGS' }, row)).toBe(true);
  expect(matches({ key: 'name', op: 'contains', value: 'a' }, {})).toBe(false);
});

test('compileCondition text operators read a related record by its label', () => {
  const row = { company: { _id: 'c1', name: 'Acme Ltd' } };
  expect(matches({ key: 'company', op: 'contains', value: 'acme' }, row)).toBe(true);
  expect(matches({ key: 'company', op: 'eq', value: 'c1' }, row)).toBe(true);
});

test('compileCondition tags contains means the array has the value', () => {
  expect(matches({ key: 'labels', op: 'contains', value: 'VIP' }, { labels: ['vip'] })).toBe(true);
  expect(matches({ key: 'labels', op: 'contains', value: 'vi' }, { labels: ['vip'] })).toBe(false);
});

test('compileCondition gt, gte, lt and lte compare numbers', () => {
  const row = { amount: 100 };
  expect(matches({ key: 'amount', op: 'gt', value: 99 }, row)).toBe(true);
  expect(matches({ key: 'amount', op: 'gt', value: 100 }, row)).toBe(false);
  expect(matches({ key: 'amount', op: 'gte', value: 100 }, row)).toBe(true);
  expect(matches({ key: 'amount', op: 'lt', value: 100 }, row)).toBe(false);
  expect(matches({ key: 'amount', op: 'lte', value: 100 }, row)).toBe(true);
  expect(matches({ key: 'amount', op: 'gt', value: 0 }, { amount: null })).toBe(false);
  expect(matches({ key: 'amount', op: 'lt', value: 1 }, { amount: 'n/a' })).toBe(false);
});

test('compileCondition between is inclusive and takes an open end', () => {
  expect(matches({ key: 'amount', op: 'between', value: [10, 20] }, { amount: 10 })).toBe(true);
  expect(matches({ key: 'amount', op: 'between', value: [10, 20] }, { amount: 20 })).toBe(true);
  expect(matches({ key: 'amount', op: 'between', value: [10, 20] }, { amount: 21 })).toBe(false);
  expect(matches({ key: 'amount', op: 'between', value: [10, null] }, { amount: 1e9 })).toBe(true);
});

test('compileCondition between requires a two item array', () => {
  expect(() => matches({ key: 'amount', op: 'between', value: 10 }, {})).toThrow(
    'Condition operator "between" requires a [from, to] array. Received 10.'
  );
});

test('compileCondition before, after and between on a date column compare whole days', () => {
  const row = { created: '2026-03-01T23:00:00' };
  expect(matches({ key: 'created', op: 'before', value: '2026-03-02' }, row)).toBe(true);
  expect(matches({ key: 'created', op: 'before', value: '2026-03-01' }, row)).toBe(false);
  expect(matches({ key: 'created', op: 'after', value: '2026-02-28' }, row)).toBe(true);
  expect(matches({ key: 'created', op: 'after', value: '2026-03-01' }, row)).toBe(false);
  expect(matches({ key: 'created', op: 'between', value: ['2026-02-01', '2026-03-01'] }, row)).toBe(
    true
  );
  expect(matches({ key: 'created', op: 'lte', value: '2026-03-01' }, row)).toBe(true);
});

test('compileCondition before and after on a datetime column compare the instant', () => {
  const row = { updated: '2026-03-01T23:00:00' };
  expect(matches({ key: 'updated', op: 'after', value: '2026-03-01T22:00:00' }, row)).toBe(true);
  expect(matches({ key: 'updated', op: 'before', value: '2026-03-01T22:00:00' }, row)).toBe(false);
  expect(matches({ key: 'updated', op: 'before', value: '2026-03-02' }, { updated: null })).toBe(
    false
  );
});

test('compileCondition within last and next count whole days around now', () => {
  const last = { key: 'created', op: 'within', value: { last: 7, unit: 'day' } };
  expect(matches(last, { created: '2026-03-08T00:00:00' })).toBe(true);
  expect(matches(last, { created: '2026-03-15T23:59:00' })).toBe(true);
  expect(matches(last, { created: '2026-03-07T23:59:00' })).toBe(false);
  expect(matches(last, { created: '2026-03-16' })).toBe(false);
  const next = { key: 'created', op: 'within', value: { next: 1, unit: 'month' } };
  expect(matches(next, { created: '2026-03-15' })).toBe(true);
  expect(matches(next, { created: '2026-04-15T20:00:00' })).toBe(true);
  expect(matches(next, { created: '2026-04-16' })).toBe(false);
  expect(matches(next, { created: '2026-03-14' })).toBe(false);
  expect(matches(next, {})).toBe(false);
});

test('compileCondition within requires last or next and a known unit', () => {
  expect(() =>
    matches({ key: 'created', op: 'within', value: { last: 2, unit: 'hour' } }, {})
  ).toThrow('Condition operator "within" requires { last: n, unit } or { next: n, unit }');
  expect(() => matches({ key: 'created', op: 'within', value: { unit: 'day' } }, {})).toThrow(
    'Condition operator "within" requires a number in "last" or "next".'
  );
});

test('compileCondition isTrue and isFalse test booleans', () => {
  expect(matches({ key: 'active', op: 'isTrue' }, { active: true })).toBe(true);
  expect(matches({ key: 'active', op: 'isTrue' }, { active: 'true' })).toBe(false);
  expect(matches({ key: 'active', op: 'isFalse' }, { active: false })).toBe(true);
  expect(matches({ key: 'active', op: 'isFalse' }, {})).toBe(true);
});

test('compileCondition and groups need every condition, or groups need one', () => {
  const row = { name: 'Acme', amount: 50 };
  const high = { key: 'amount', op: 'gte', value: 100 };
  const acme = { key: 'name', op: 'eq', value: 'acme' };
  expect(matches({ and: [high, acme] }, row)).toBe(false);
  expect(matches({ or: [high, acme] }, row)).toBe(true);
  expect(
    matches({ and: [acme, { or: [high, { key: 'amount', op: 'lt', value: 60 }] }] }, row)
  ).toBe(true);
});

test('compileCondition treats a missing or empty condition and empty groups as true', () => {
  expect(matches(undefined, {})).toBe(true);
  expect(matches(null, {})).toBe(true);
  expect(matches({}, {})).toBe(true);
  expect(matches({ and: [] }, {})).toBe(true);
  expect(matches({ or: [] }, {})).toBe(true);
});

test('compileCondition resolves $user values from the user', () => {
  const user = { id: 'u1', teams: ['t1', 't2'] };
  const mine = { key: 'owner', op: 'eq', value: { $user: 'id' } };
  expect(matches(mine, { owner: { id: 'u1' } }, { user })).toBe(true);
  expect(matches(mine, { owner: { id: 'u2' } }, { user })).toBe(false);
  expect(
    matches({ key: 'name', op: 'in', value: [{ $user: 'id' }, 'x'] }, { name: 'U1' }, { user })
  ).toBe(true);
  expect(matches(mine, { owner: { id: 'u1' } })).toBe(false);
});

test('compileCondition leaves without a key test the column value', () => {
  const column = columnsByKey.amount;
  const test = compileCondition({ condition: { op: 'gte', value: 8 }, column, now });
  expect(test({}, 9)).toBe(true);
  expect(test({}, 7)).toBe(false);
  const dayTest = compileCondition({
    condition: { op: 'eq', value: '2026-03-01' },
    column: columnsByKey.created,
    now,
  });
  expect(dayTest({}, '2026-03-01T20:00:00')).toBe(true);
});

test('compileCondition reads a key that names no column as a row field path', () => {
  expect(matches({ key: 'meta.flag', op: 'eq', value: 'x' }, { meta: { flag: 'X' } })).toBe(true);
});

test('compileCondition throws on an unknown operator', () => {
  expect(() => matches({ key: 'name', op: 'like', value: 'a' }, {})).toThrow(
    'Unknown condition operator "like".'
  );
});

test('compileCondition throws on a leaf without op', () => {
  expect(() => matches({ key: 'name', value: 'a' }, {})).toThrow(
    'Condition requires an "op", or an "and" or "or" list. Received {"key":"name","value":"a"}.'
  );
});

test('compileCondition throws when a group is not a list', () => {
  expect(() => matches({ and: { key: 'name', op: 'empty' } }, {})).toThrow(
    'Condition "and" must be a list of conditions.'
  );
});

test('compileCondition in and eq keep exact equality for values without a key', () => {
  const inTest = compileCondition({
    condition: { key: 'v', op: 'in', value: [NaN, { name: 'x' }, true, 5] },
    columnsByKey,
  });
  expect(inTest({ v: NaN })).toBe(false);
  expect(inTest({ v: { name: 'X' } })).toBe(true);
  expect(inTest({ v: 'TRUE' })).toBe(true);
  expect(inTest({ v: '5' })).toBe(true);
  expect(inTest({ v: 1 })).toBe(false);
  expect(inTest({ v: new Date(0) })).toBe(false);
  const eqTest = compileCondition({
    condition: { key: 'v', op: 'eq', value: 'Ada' },
    columnsByKey,
  });
  expect(eqTest({ v: ['ada'] })).toBe(true);
  expect(eqTest({ v: ['ada', 'bob'] })).toBe(false);
});

test('compileCondition reads nested row fields and literal dotted keys', () => {
  const test = compileCondition({
    condition: { key: 'owner.name', op: 'eq', value: 'ada' },
    columnsByKey: {},
  });
  expect(test({ owner: { name: 'Ada' } })).toBe(true);
  expect(test({ 'owner.name': 'Ada' })).toBe(true);
  expect(test({ owner: null })).toBe(false);
});
