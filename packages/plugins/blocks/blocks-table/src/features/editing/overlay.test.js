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

import applyOverlay from './applyOverlay.js';
import getEventError from './getEventError.js';
import pruneOverlay from './pruneOverlay.js';

const getKey = (row) => row.id;

function entry({ row, status, value = 'X', hasValue = true, field = 'name' }) {
  return { rowKey: String(row.id), colKey: field, field, value, hasValue, status, source: row };
}

describe('applyOverlay', () => {
  const rows = [
    { id: 1, name: 'Ann', address: { city: 'Berlin' } },
    { id: 2, name: 'Ben', address: { city: 'Austin' } },
  ];

  test('applyOverlay returns the data itself when there is nothing to show', () => {
    expect(applyOverlay({ rows, overlay: new Map(), getKey, sources: new WeakMap() })).toBe(rows);
  });

  test('applyOverlay shows an edit on a copy of its row and never writes the data', () => {
    const sources = new WeakMap();
    const overlay = new Map([
      ['1', entry({ row: rows[0], status: 'saving', field: 'address.city', value: 'Paris' })],
    ]);
    const next = applyOverlay({ rows, overlay, getKey, sources });
    expect(next[0].address.city).toBe('Paris');
    expect(rows[0].address.city).toBe('Berlin');
    expect(next[1]).toBe(rows[1]);
    expect(sources.get(next[0])).toBe(rows[0]);
  });

  test('applyOverlay stops showing a saved edit once its row changed in the data', () => {
    const changed = [{ id: 1, name: 'Anna' }, rows[1]];
    const overlay = new Map([['1', entry({ row: rows[0], status: 'saved' })]]);
    const next = applyOverlay({ rows: changed, overlay, getKey, sources: new WeakMap() });
    expect(next[0]).toBe(changed[0]);
  });

  test('applyOverlay keeps showing an edit that is still saving when the data changed', () => {
    const changed = [{ id: 1, name: 'Anna' }, rows[1]];
    const overlay = new Map([['1', entry({ row: rows[0], status: 'saving' })]]);
    const next = applyOverlay({ rows: changed, overlay, getKey, sources: new WeakMap() });
    expect(next[0].name).toBe('X');
  });

  test('applyOverlay shows the data value for a failed edit', () => {
    const overlay = new Map([
      ['1', entry({ row: rows[0], status: 'error', hasValue: false, value: 'X' })],
    ]);
    expect(applyOverlay({ rows, overlay, getKey, sources: new WeakMap() })).toBe(rows);
  });
});

describe('pruneOverlay', () => {
  const rows = [
    { id: 1, name: 'Ann' },
    { id: 2, name: 'Ben' },
  ];

  test('pruneOverlay keeps entries whose rows did not change', () => {
    const overlay = new Map([['1', entry({ row: rows[0], status: 'saved' })]]);
    expect(pruneOverlay({ overlay, rows, getKey })).toBe(overlay);
  });

  test('pruneOverlay drops settled entries whose row changed or left, and keeps saving ones', () => {
    const overlay = new Map([
      ['1', entry({ row: rows[0], status: 'saved' })],
      ['2', entry({ row: rows[1], status: 'error', hasValue: false })],
      ['3', entry({ row: { id: 3 }, status: 'saving' })],
    ]);
    const next = pruneOverlay({ overlay, rows: [{ id: 1, name: 'Anna' }, rows[1]], getKey });
    expect([...next.keys()]).toEqual(['2', '3']);
    const gone = pruneOverlay({ overlay: next, rows: [], getKey });
    expect([...gone.keys()]).toEqual(['3']);
  });
});

describe('getEventError', () => {
  test('getEventError is null for a successful or bounced event', () => {
    expect(getEventError({ success: true })).toBe(null);
    expect(getEventError({ success: true, bounced: true })).toBe(null);
  });

  test('getEventError reads the message of the action error', () => {
    const result = { success: false, error: { error: new Error('Deal is locked.'), index: 0 } };
    expect(getEventError(result)).toBe('Deal is locked.');
  });

  test('getEventError falls back to a generic message', () => {
    expect(getEventError({ success: false })).toBe('The change was not saved.');
  });
});
