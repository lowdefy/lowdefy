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

import dayjs from 'dayjs';

import findNextEditableCell from './findNextEditableCell.js';
import fromEditorDraft from './fromEditorDraft.js';
import getEditorKind from './getEditorKind.js';
import toDateValue from './toDateValue.js';
import toEditorDraft from './toEditorDraft.js';
import valuesEqual from './valuesEqual.js';

function spec(type) {
  return { type, kind: getEditorKind(type) };
}

test('toEditorDraft seeds a text editor with the typed character', () => {
  expect(toEditorDraft({ spec: spec('text'), value: 'Ann', seed: 'b' })).toBe('b');
  expect(toEditorDraft({ spec: spec('text'), value: null })).toBe('');
});

test('toEditorDraft seeds a number editor with a typed digit only', () => {
  expect(toEditorDraft({ spec: spec('number'), value: 42, seed: '7' })).toBe(7);
  expect(toEditorDraft({ spec: spec('number'), value: 42, seed: 'x' })).toBe(42);
});

test('a percent edits as the number shown and commits back as a fraction', () => {
  expect(toEditorDraft({ spec: spec('percent'), value: 0.07 })).toBe(7);
  expect(fromEditorDraft({ spec: spec('percent'), draft: 12.5 })).toBe(0.125);
  expect(fromEditorDraft({ spec: spec('percent'), draft: null })).toBe(null);
});

test('a date round-trips through the editor without changing', () => {
  const stored = new Date('2026-03-01T00:00:00.000Z');
  const draft = toEditorDraft({ spec: spec('date'), value: stored });
  expect(draft.format('YYYY-MM-DD')).toBe('2026-03-01');
  const committed = fromEditorDraft({ spec: spec('date'), draft, previous: stored });
  expect(valuesEqual(committed, stored)).toBe(true);
});

test('toDateValue keeps day strings as day strings and stores days as UTC midnight', () => {
  const picked = dayjs('2026-05-04T15:30:00');
  expect(toDateValue({ date: picked, kind: 'date', previous: '2026-01-01' })).toBe('2026-05-04');
  expect(toDateValue({ date: picked, kind: 'date', previous: null })).toEqual(
    new Date('2026-05-04T00:00:00.000Z')
  );
  expect(toDateValue({ date: null, kind: 'date' })).toBe(null);
  expect(toDateValue({ date: picked, kind: 'datetime', previous: 'x' })).toBe(
    picked.toDate().toISOString()
  );
});

test('valuesEqual treats empty values as one and compares dates and arrays by content', () => {
  expect(valuesEqual(null, '')).toBe(true);
  expect(valuesEqual(undefined, 'a')).toBe(false);
  expect(valuesEqual(new Date(1), new Date(1))).toBe(true);
  expect(valuesEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  expect(valuesEqual(['a'], ['b'])).toBe(false);
  expect(valuesEqual(1, '1')).toBe(false);
});

describe('findNextEditableCell', () => {
  const specs = new Map([
    ['name', { editable: true, when: null }],
    ['age', { editable: true, when: (row) => row.locked !== true }],
    ['city', { editable: false, when: null }],
  ]);
  const accessor = (key) => (row) => row[key];
  const cols = [
    { key: '__select', special: 'select' },
    { key: 'name', accessor: accessor('name') },
    { key: 'city', accessor: accessor('city') },
    { key: 'age', accessor: accessor('age') },
  ];
  const rows = [
    { id: 'a', original: { name: 'Ann', age: 1 } },
    { id: 'b', original: { name: 'Ben', age: 2, locked: true } },
  ];

  test('findNextEditableCell skips special and read-only columns along the row', () => {
    expect(
      findNextEditableCell({ rows, cols, specs, rowIndex: 0, colIndex: 1, direction: 1 })
    ).toEqual({ rowIndex: 0, colIndex: 3, rowId: 'a', colKey: 'age' });
  });

  test('findNextEditableCell wraps to the next row and applies editable.when per row', () => {
    expect(
      findNextEditableCell({ rows, cols, specs, rowIndex: 0, colIndex: 3, direction: 1 })
    ).toEqual({ rowIndex: 1, colIndex: 1, rowId: 'b', colKey: 'name' });
    expect(
      findNextEditableCell({ rows, cols, specs, rowIndex: 1, colIndex: 1, direction: 1 })
    ).toBe(null);
  });

  test('findNextEditableCell goes backwards with direction -1', () => {
    expect(
      findNextEditableCell({ rows, cols, specs, rowIndex: 1, colIndex: 1, direction: -1 })
    ).toEqual({ rowIndex: 0, colIndex: 3, rowId: 'a', colKey: 'age' });
  });
});
