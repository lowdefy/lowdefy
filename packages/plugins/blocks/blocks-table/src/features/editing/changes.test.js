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

import addChangeRow from './addChangeRow.js';
import applyChanges from './applyChanges.js';
import applyChangeUpdates from './applyChangeUpdates.js';
import applyMoveToChanges from './applyMoveToChanges.js';
import createEmptyChanges from './createEmptyChanges.js';
import createNewRow from './createNewRow.js';
import normalizeChanges from './normalizeChanges.js';
import removeChangeRow from './removeChangeRow.js';
import setChangeField from './setChangeField.js';
import setRowField from './setRowField.js';

const getKey = (row) => row.id;

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function makeRows() {
  return deepFreeze([
    { id: 1, name: 'Ann', position: 1024, address: { city: 'Berlin', zip: '10115' } },
    { id: 2, name: 'Ben', position: 2048, address: { city: 'Austin', zip: '73301' } },
    { id: 3, name: 'Cat', position: 3072, address: { city: 'Durban', zip: '4001' } },
  ]);
}

function merge({ rows = makeRows(), changes, positionField, cache = new WeakMap() }) {
  return applyChanges({ rows, changes, getKey, keyField: 'id', positionField, cache });
}

describe('setRowField', () => {
  test('setRowField sets a nested field on a copy and leaves a frozen row untouched', () => {
    const row = deepFreeze({ id: 1, address: { city: 'Berlin', zip: '10115' } });
    const next = setRowField({ row, field: 'address.city', value: 'Paris' });
    expect(next).toEqual({ id: 1, address: { city: 'Paris', zip: '10115' } });
    expect(row.address.city).toBe('Berlin');
    expect(next.address).not.toBe(row.address);
  });

  test('setRowField keeps Date values as dates', () => {
    const date = new Date('2026-03-01T00:00:00.000Z');
    expect(setRowField({ row: { id: 1 }, field: 'due', value: date }).due).toEqual(date);
  });
});

describe('normalizeChanges', () => {
  test('normalizeChanges returns a complete changeset as it is', () => {
    const changes = { updated: {}, added: [], removed: [], order: [1] };
    expect(normalizeChanges(changes)).toBe(changes);
  });

  test('normalizeChanges fills in a partial or missing value', () => {
    expect(normalizeChanges(null)).toEqual(createEmptyChanges());
    expect(normalizeChanges({ removed: [2], moved: { 1: 5 } })).toEqual({
      updated: {},
      added: [],
      removed: [2],
      moved: { 1: 5 },
    });
  });
});

describe('setChangeField', () => {
  test('setChangeField records only the changed field under its dot path', () => {
    const rows = makeRows();
    const changes = setChangeField({
      changes: createEmptyChanges(),
      rowKey: 3,
      field: 'address.city',
      value: 'Cape Town',
      dataRow: rows[2],
    });
    expect(changes).toEqual({
      updated: { 3: { 'address.city': 'Cape Town' } },
      added: [],
      removed: [],
    });
    expect(rows[2].address.city).toBe('Durban');
  });

  test('setChangeField removes a field edited back to its original value, and the empty row', () => {
    const rows = makeRows();
    let changes = setChangeField({
      changes: createEmptyChanges(),
      rowKey: 1,
      field: 'name',
      value: 'Anna',
      dataRow: rows[0],
    });
    changes = setChangeField({ changes, rowKey: 1, field: 'age', value: 5, dataRow: rows[0] });
    changes = setChangeField({ changes, rowKey: 1, field: 'name', value: 'Ann', dataRow: rows[0] });
    expect(changes.updated).toEqual({ 1: { age: 5 } });
    changes = setChangeField({
      changes,
      rowKey: 1,
      field: 'age',
      value: undefined,
      dataRow: rows[0],
    });
    expect(changes.updated).toEqual({});
  });

  test('setChangeField returns the same changeset when nothing changes', () => {
    const changes = createEmptyChanges();
    const rows = makeRows();
    expect(
      setChangeField({ changes, rowKey: 1, field: 'name', value: 'Ann', dataRow: rows[0] })
    ).toBe(changes);
  });

  test('setChangeField writes an added row field into its added entry', () => {
    const changes = addChangeRow({
      changes: createEmptyChanges(),
      rowKey: 'tmp',
      fields: { qty: 1 },
    });
    const next = setChangeField({
      changes,
      rowKey: 'tmp',
      field: 'details.note',
      value: 'new',
      dataRow: undefined,
    });
    expect(next.added).toEqual([{ rowKey: 'tmp', qty: 1, details: { note: 'new' } }]);
    expect(next.updated).toEqual({});
  });
});

describe('removeChangeRow', () => {
  test('removeChangeRow records a data row key and drops its pending changes', () => {
    const changes = {
      updated: { 2: { name: 'Bea' }, 3: { name: 'Cara' } },
      added: [],
      removed: [],
      moved: { 2: 5 },
    };
    expect(removeChangeRow({ changes, rowKey: 2 })).toEqual({
      updated: { 3: { name: 'Cara' } },
      added: [],
      removed: [2],
    });
  });

  test('removeChangeRow drops an added row from added without recording it as removed', () => {
    const changes = addChangeRow({
      changes: { ...createEmptyChanges(), order: [1, 2] },
      rowKey: 'tmp',
      fields: {},
    });
    expect(changes.order).toEqual([1, 2, 'tmp']);
    expect(removeChangeRow({ changes, rowKey: 'tmp' })).toEqual({
      updated: {},
      added: [],
      removed: [],
      order: [1, 2],
    });
  });
});

describe('applyChanges', () => {
  test('applyChanges returns the data itself when there are no changes', () => {
    const rows = makeRows();
    expect(merge({ rows, changes: createEmptyChanges() })).toBe(rows);
  });

  test('applyChanges shows updates on copies, drops removed rows and appends added rows', () => {
    const rows = makeRows();
    const merged = merge({
      rows,
      changes: {
        updated: { 1: { 'address.city': 'Paris', name: 'Anna' } },
        added: [{ rowKey: 'tmp', name: 'Dan' }],
        removed: [2],
      },
    });
    expect(merged.map((row) => row.name)).toEqual(['Anna', 'Cat', 'Dan']);
    expect(merged[0].address).toEqual({ city: 'Paris', zip: '10115' });
    expect(merged[1]).toBe(rows[2]);
    expect(merged[2]).toEqual({ id: 'tmp', name: 'Dan' });
    expect(rows[0].name).toBe('Ann');
  });

  test('applyChanges keeps a touched row copy while its patch is the same object', () => {
    const rows = makeRows();
    const cache = new WeakMap();
    const patch = { name: 'Anna' };
    const first = merge({
      rows,
      cache,
      changes: { updated: { 1: patch }, added: [], removed: [] },
    });
    const second = merge({
      rows,
      cache,
      changes: { updated: { 1: patch, 3: { name: 'Cara' } }, added: [], removed: [] },
    });
    expect(second[0]).toBe(first[0]);
    expect(second[1]).toBe(rows[1]);
  });

  test('applyChanges orders by the recorded key order', () => {
    const merged = merge({
      changes: { updated: {}, added: [{ rowKey: 'tmp', name: 'Dan' }], removed: [], order: [3, 1] },
    });
    expect(merged.map(getKey)).toEqual([3, 1, 2, 'tmp']);
  });

  test('applyChanges places moved rows by their new positions', () => {
    const merged = merge({
      positionField: 'position',
      changes: { updated: {}, added: [], removed: [], moved: { 3: 1536 } },
    });
    expect(merged.map(getKey)).toEqual([1, 3, 2]);
    expect(merged[1].position).toBe(1536);
  });
});

describe('applyChangeUpdates', () => {
  test('applyChangeUpdates folds a paste into one changeset over data and added rows', () => {
    const rows = makeRows();
    const changes = addChangeRow({ changes: createEmptyChanges(), rowKey: 'tmp', fields: {} });
    const next = applyChangeUpdates({
      changes,
      dataByKey: new Map(rows.map((row) => [String(row.id), row])),
      updates: [
        { rowKey: 1, field: 'name', value: 'Anna' },
        { rowKey: 2, field: 'name', value: 'Ben' },
        { rowKey: 'tmp', field: 'name', value: 'Dan' },
      ],
    });
    expect(next).toEqual({
      updated: { 1: { name: 'Anna' } },
      added: [{ rowKey: 'tmp', name: 'Dan' }],
      removed: [],
    });
  });
});

describe('applyMoveToChanges', () => {
  const rows = makeRows();
  const dataByKey = new Map(rows.map((row) => [String(row.id), row]));

  test('applyMoveToChanges records new positions of data rows in moved', () => {
    const next = applyMoveToChanges({
      changes: createEmptyChanges(),
      move: { positions: { 3: 1536 } },
      positionField: 'position',
      dataByKey,
    });
    expect(next.moved).toEqual({ 3: 1536 });
  });

  test('applyMoveToChanges drops a row moved back to its original position', () => {
    const next = applyMoveToChanges({
      changes: { ...createEmptyChanges(), moved: { 3: 1536 } },
      move: { positions: { 3: 3072 } },
      positionField: 'position',
      dataByKey,
    });
    expect(next).toEqual(createEmptyChanges());
  });

  test('applyMoveToChanges writes an added row position into its entry', () => {
    const changes = addChangeRow({
      changes: createEmptyChanges(),
      rowKey: 'tmp',
      fields: { position: 4096 },
    });
    const next = applyMoveToChanges({
      changes,
      move: { positions: { tmp: 512 } },
      positionField: 'position',
      dataByKey,
    });
    expect(next.added).toEqual([{ rowKey: 'tmp', position: 512 }]);
    expect(next.moved).toBeUndefined();
  });

  test('applyMoveToChanges records the full key order without a position field', () => {
    const next = applyMoveToChanges({
      changes: createEmptyChanges(),
      move: { order: [2, 3, 1] },
      positionField: null,
      dataByKey,
    });
    expect(next.order).toEqual([2, 3, 1]);
  });
});

describe('createNewRow', () => {
  const specs = new Map([
    ['name', { field: 'name', default: 'New' }],
    ['qty', { field: 'line.qty', default: 1 }],
    ['note', { field: 'note', default: undefined }],
  ]);

  test('createNewRow sets column defaults and generates a temporary key kept out of the fields', () => {
    expect(createNewRow({ specs, keyField: 'id', generateKey: () => 'k1' })).toEqual({
      rowKey: 'k1',
      fields: { name: 'New', line: { qty: 1 } },
    });
  });

  test('createNewRow gives every added row its own key, even with a key column default', () => {
    const withKey = new Map([
      ['id', { field: 'id', default: 'fixed' }],
      ['name', { field: 'name', default: 'New' }],
    ]);
    let count = 0;
    const generateKey = () => {
      count += 1;
      return `k${count}`;
    };
    const first = createNewRow({ specs: withKey, keyField: 'id', generateKey });
    const second = createNewRow({ specs: withKey, keyField: 'id', generateKey });
    expect(first).toEqual({ rowKey: 'k1', fields: { name: 'New' } });
    expect(second).toEqual({ rowKey: 'k2', fields: { name: 'New' } });
  });

  test('createNewRow keeps the key column default out of a nested key field', () => {
    const withKey = new Map([
      ['key', { field: 'meta.key', default: 'fixed' }],
      ['kind', { field: 'meta.kind', default: 'a' }],
    ]);
    expect(createNewRow({ specs: withKey, keyField: 'meta.key', generateKey: () => 'k1' })).toEqual(
      { rowKey: 'k1', fields: { meta: { kind: 'a' } } }
    );
  });

  test('createNewRow copies object defaults so rows never share them', () => {
    const objectDefault = new Map([['tags', { field: 'tags', default: ['a'] }]]);
    const first = createNewRow({ specs: objectDefault, keyField: '_id', generateKey: () => 1 });
    const second = createNewRow({ specs: objectDefault, keyField: '_id', generateKey: () => 2 });
    expect(first.fields.tags).not.toBe(second.fields.tags);
  });
});
