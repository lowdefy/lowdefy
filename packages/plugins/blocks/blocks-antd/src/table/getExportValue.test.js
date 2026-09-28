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

import compileColumns from './compileColumns.js';
import getExportValue from './getExportValue.js';
import normalizeColumns from './normalizeColumns.js';

const normalized = normalizeColumns({
  columns: [
    { key: 'name' },
    { key: 'amount', type: 'currency', cell: { currency: 'EUR', locale: 'en-US' } },
    { key: 'share', type: 'percent', cell: { locale: 'en-US', decimals: 1 } },
    { key: 'created', type: 'date' },
    { key: 'seen', type: 'datetime', cell: { format: 'D MMM YYYY HH:mm' } },
    { key: 'active', type: 'boolean', cell: { trueLabel: 'On' } },
    { key: 'stage', type: 'status', options: [{ value: 'won', label: 'Won' }] },
    { key: 'labels', type: 'tags', options: { vip: 'VIP' } },
    { key: 'owners', type: 'people' },
    { key: 'company', type: 'relation' },
    { key: 'site', type: 'link', cell: { labelField: 'name' } },
    { key: 'bio', type: 'html', cell: { template: '<b>{{ value }}</b> &amp; more' } },
    { key: 'raw', type: 'html' },
    { key: 'meta', type: 'json' },
    { key: 'done', type: 'progress' },
    { key: 'person', type: 'avatar', cell: { nameField: 'name' } },
    { key: 'actions', type: 'buttons' },
  ],
});
const columns = Object.fromEntries(
  compileColumns({ columns: normalized.columns, columnsByKey: normalized.columnsByKey }).map(
    (column) => [column.key, column]
  )
);

const row = {
  name: 'Acme',
  amount: 1234.5,
  share: 0.125,
  created: '2026-03-01T10:00:00',
  seen: '2026-03-01T10:05:00',
  active: true,
  stage: 'won',
  labels: ['vip', 'new'],
  owners: [{ name: 'Ann' }, 'Bob'],
  company: { _id: 'c1', name: 'Acme Ltd' },
  site: 'https://acme.test',
  bio: 'A < B',
  raw: '<i>Hi</i>',
  meta: { a: [1, 2] },
  done: 40,
};

function exported(key, formatted) {
  return getExportValue({ column: columns[key], value: row[key], row, formatted });
}

test('getExportValue formatted gives the text the cell shows', () => {
  expect(exported('name', true)).toBe('Acme');
  expect(exported('amount', true)).toBe('€1,234.50');
  expect(exported('share', true)).toBe('12.5%');
  expect(exported('created', true)).toBe('2026-03-01');
  expect(exported('seen', true)).toBe('1 Mar 2026 10:05');
  expect(exported('active', true)).toBe('On');
  expect(exported('stage', true)).toBe('Won');
  expect(exported('labels', true)).toBe('VIP, new');
  expect(exported('owners', true)).toBe('Ann, Bob');
  expect(exported('company', true)).toBe('Acme Ltd');
  expect(exported('site', true)).toBe('Acme');
  expect(exported('bio', true)).toBe('A < B & more');
  expect(exported('raw', true)).toBe('Hi');
  expect(exported('meta', true)).toBe('{"a":[1,2]}');
  expect(exported('done', true)).toBe('40%');
  expect(exported('person', true)).toBe('Acme');
});

test('getExportValue raw keeps numbers and booleans and flattens the rest', () => {
  expect(exported('amount', false)).toBe(1234.5);
  expect(exported('active', false)).toBe(true);
  expect(exported('stage', false)).toBe('won');
  expect(exported('labels', false)).toBe('vip, new');
  expect(exported('owners', false)).toBe('Ann, Bob');
  expect(exported('company', false)).toBe('Acme Ltd');
  expect(exported('meta', false)).toBe('{"a":[1,2]}');
  expect(exported('raw', false)).toBe('<i>Hi</i>');
});

test('getExportValue writes dates as ISO strings and empty values as empty strings', () => {
  const date = new Date('2026-03-01T10:00:00.000Z');
  expect(getExportValue({ column: columns.created, value: date, row: {} })).toBe(
    '2026-03-01T10:00:00.000Z'
  );
  expect(getExportValue({ column: columns.name, value: null, row: {} })).toBe('');
  expect(
    getExportValue({ column: columns.amount, value: undefined, row: {}, formatted: true })
  ).toBe('');
  expect(getExportValue({ column: columns.labels, value: [], row: {} })).toBe('');
});

test('getExportValue exports action columns as an empty string', () => {
  expect(exported('actions', true)).toBe('');
  expect(exported('actions', false)).toBe('');
});
