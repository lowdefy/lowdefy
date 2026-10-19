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

import createEditSpecs from './createEditSpecs.js';
import findInvalidCells from './findInvalidCells.js';
import isCellEditable from './isCellEditable.js';
import validateCellValue from './validateCellValue.js';

// Normalised columns as the column model hands them over (the local stand-in coerces
// `editable` to a boolean, so the raw config is what carries `{ when }`).
function column(key, extra = {}) {
  return { key, field: key, type: 'text', cell: {}, editable: false, validate: [], ...extra };
}

const rawColumns = [
  { key: 'name', editable: true, required: true, default: 'New' },
  {
    title: 'Deal',
    children: [
      {
        key: 'amount',
        type: 'number',
        editable: { when: { key: 'stage', op: 'ne', value: 'won' } },
        validate: [{ pass: { op: 'gte', value: 0 }, message: 'Must be positive.' }],
      },
    ],
  },
  { key: 'stage', type: 'status', options: ['lead', 'won'], editable: true },
  { key: 'raw', type: 'json', editable: true },
  'note',
];

const columns = [
  column('name', { editable: true }),
  column('amount', { type: 'number' }),
  column('stage', { type: 'status', options: ['lead', 'won'], editable: true }),
  column('raw', { type: 'json', editable: true }),
  column('note'),
];

const specs = createEditSpecs({ columns, rawColumns, defaultColumn: {} });

test('createEditSpecs reads editable, required and default from the raw config, groups included', () => {
  expect(specs.get('name')).toMatchObject({
    editable: true,
    required: true,
    default: 'New',
    kind: 'text',
  });
  expect(specs.get('amount').editable).toBe(true);
  expect(typeof specs.get('amount').when).toBe('function');
  expect(specs.get('note').editable).toBe(false);
});

test('createEditSpecs never makes a type without an editor editable', () => {
  expect(specs.get('raw').editable).toBe(false);
  expect(specs.get('raw').kind).toBe(null);
});

test('createEditSpecs normalises options for the select editor', () => {
  expect(specs.get('stage').options).toEqual([
    { value: 'lead', label: 'lead' },
    { value: 'won', label: 'won' },
  ]);
});

test('createEditSpecs applies defaultColumn editable when a column does not set it', () => {
  const withDefault = createEditSpecs({
    columns: [column('note')],
    rawColumns: ['note'],
    defaultColumn: { editable: true },
  });
  expect(withDefault.get('note').editable).toBe(true);
});

test('isCellEditable tests editable.when against the row', () => {
  const amount = specs.get('amount');
  expect(isCellEditable({ spec: amount, row: { stage: 'lead', amount: 5 }, value: 5 })).toBe(true);
  expect(isCellEditable({ spec: amount, row: { stage: 'won', amount: 5 }, value: 5 })).toBe(false);
  expect(isCellEditable({ spec: specs.get('note'), row: {}, value: 'x' })).toBe(false);
});

test('validateCellValue returns the first failing message or null', () => {
  expect(validateCellValue({ spec: specs.get('name'), row: {}, value: '' })).toBe('Required.');
  expect(validateCellValue({ spec: specs.get('name'), row: {}, value: 'Ann' })).toBe(null);
  expect(validateCellValue({ spec: specs.get('amount'), row: {}, value: -1 })).toBe(
    'Must be positive.'
  );
  expect(validateCellValue({ spec: specs.get('amount'), row: {}, value: 3 })).toBe(null);
});

test('findInvalidCells maps failing cells by row key and column key', () => {
  const invalid = findInvalidCells({
    rows: [
      { id: 1, name: 'Ann', amount: 3 },
      { id: 2, name: '', amount: -2 },
    ],
    specs,
    getKey: (row) => row.id,
  });
  expect([...invalid.keys()]).toEqual(['2']);
  expect(Object.fromEntries(invalid.get('2'))).toEqual({
    name: 'Required.',
    amount: 'Must be positive.',
  });
});
