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
import test from 'node:test';

import countConditions from './countConditions.js';
import getQuickFilterValues from './getQuickFilterValues.js';
import normalizeToolbar from './normalizeToolbar.js';
import setQuickFilterValues from './setQuickFilterValues.js';

test('setQuickFilterValues adds an in leaf ANDed with the existing filter', () => {
  const amount = { key: 'amount', op: 'gte', value: 100 };
  assert.deepEqual(setQuickFilterValues({ filter: null, key: 'stage', values: ['lead'] }), {
    and: [{ key: 'stage', op: 'in', value: ['lead'] }],
  });
  assert.deepEqual(setQuickFilterValues({ filter: amount, key: 'stage', values: ['won'] }), {
    and: [amount, { key: 'stage', op: 'in', value: ['won'] }],
  });
});

test('setQuickFilterValues replaces and removes its own leaf and keeps the rest', () => {
  const other = { or: [{ key: 'owner', op: 'eq', value: 'ada' }] };
  const filter = { and: [other, { key: 'stage', op: 'in', value: ['lead'] }] };
  assert.deepEqual(setQuickFilterValues({ filter, key: 'stage', values: ['lead', 'won'] }), {
    and: [other, { key: 'stage', op: 'in', value: ['lead', 'won'] }],
  });
  assert.deepEqual(setQuickFilterValues({ filter, key: 'stage', values: [] }), { and: [other] });
  assert.equal(
    setQuickFilterValues({
      filter: { and: [{ key: 'stage', op: 'in', value: ['lead'] }] },
      key: 'stage',
      values: [],
    }),
    null
  );
});

test('getQuickFilterValues reads the top-level in leaf of the column', () => {
  const filter = {
    and: [
      { key: 'stage', op: 'in', value: ['lead'] },
      { key: 'x', op: 'eq' },
    ],
  };
  assert.deepEqual(getQuickFilterValues({ filter, key: 'stage' }), ['lead']);
  assert.deepEqual(getQuickFilterValues({ filter, key: 'owner' }), []);
  assert.deepEqual(getQuickFilterValues({ filter: null, key: 'stage' }), []);
});

test('countConditions counts the leaves of nested groups', () => {
  assert.equal(countConditions(null), 0);
  assert.equal(countConditions({ key: 'a', op: 'empty' }), 1);
  assert.equal(
    countConditions({ and: [{ key: 'a', op: 'eq' }, { or: [{ key: 'b' }, { key: 'c' }] }] }),
    3
  );
});

test('normalizeToolbar is off by default and true turns on every item', () => {
  const columnsByKey = new Map([['stage', { key: 'stage', filterable: true }]]);
  assert.equal(normalizeToolbar({ toolbar: undefined, columnsByKey }), null);
  assert.equal(normalizeToolbar({ toolbar: false, columnsByKey }), null);
  assert.deepEqual(normalizeToolbar({ toolbar: true, columnsByKey }), {
    views: true,
    search: true,
    filter: true,
    sort: true,
    group: true,
    columns: true,
    density: true,
    export: true,
    quickFilters: [],
    count: true,
  });
  assert.deepEqual(
    normalizeToolbar({ toolbar: { search: true, quickFilters: ['stage'] }, columnsByKey }),
    {
      count: true,
      quickFilters: ['stage'],
      views: false,
      search: true,
      filter: false,
      sort: false,
      group: false,
      columns: false,
      density: false,
      export: false,
    }
  );
});

test('normalizeToolbar throws for quick filters on unknown or unfilterable columns', () => {
  const columnsByKey = new Map([['id', { key: 'id', filterable: false }]]);
  assert.throws(
    () => normalizeToolbar({ toolbar: { quickFilters: ['nope'] }, columnsByKey }),
    /no column "nope"/
  );
  assert.throws(
    () => normalizeToolbar({ toolbar: { quickFilters: ['id'] }, columnsByKey }),
    /not filterable/
  );
});
