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

import diffState from './diffState.js';

test('diffState reports no drift for deep-equal state regardless of key order', () => {
  const result = diffState({
    expected: { a: 1, form: { x: [1, 2], y: 'z' } },
    actual: { form: { y: 'z', x: [1, 2] }, a: 1 },
  });
  expect(result).toEqual({ changed: false, differences: [] });
});

test('diffState reports a changed value with its path and both values', () => {
  const result = diffState({
    expected: { form: { title: 'A', count: 1 } },
    actual: { form: { title: 'B', count: 1 } },
  });
  expect(result.changed).toBe(true);
  expect(result.differences).toEqual([{ path: 'form.title', expected: 'A', actual: 'B' }]);
});

test('diffState reports added and removed keys', () => {
  const result = diffState({ expected: { a: 1, b: 2 }, actual: { a: 1, c: 3 } });
  expect(result.differences).toEqual([
    { path: 'b', expected: 2, actual: undefined },
    { path: 'c', expected: undefined, actual: 3 },
  ]);
});

test('diffState reports array item changes by index', () => {
  const result = diffState({ expected: { rows: [1, 2, 3] }, actual: { rows: [1, 9] } });
  expect(result.differences).toEqual([
    { path: 'rows.1', expected: 2, actual: 9 },
    { path: 'rows.2', expected: 3, actual: undefined },
  ]);
});

test('diffState reports a type change as a single difference at that path', () => {
  const result = diffState({ expected: { a: { b: 1 } }, actual: { a: [1] } });
  expect(result.differences).toEqual([{ path: 'a', expected: { b: 1 }, actual: [1] }]);
});

test('diffState drops an ignored path from both sides', () => {
  const result = diffState({
    expected: { form: { created_at: '2026-01-01T00:00:00.000Z', title: 'A' } },
    actual: { form: { created_at: '2026-02-02T00:00:00.000Z', title: 'A' } },
    snapshotIgnore: ['form.created_at'],
  });
  expect(result.changed).toBe(false);
});

test('diffState drops an ignored path that is only present on one side', () => {
  const result = diffState({
    expected: { form: { title: 'A' } },
    actual: { form: { title: 'A', updated_at: 'now' } },
    snapshotIgnore: ['form.updated_at'],
  });
  expect(result.changed).toBe(false);
});

test('diffState expands $ to every array index', () => {
  const result = diffState({
    expected: {
      search: {
        results: [
          { id: 1, score: 0.1 },
          { id: 2, score: 0.2 },
        ],
      },
    },
    actual: {
      search: {
        results: [
          { id: 1, score: 0.9 },
          { id: 2, score: 0.8 },
        ],
      },
    },
    snapshotIgnore: ['search.results.$.score'],
  });
  expect(result.changed).toBe(false);
});

test('diffState still reports an unignored change next to an ignored one', () => {
  const result = diffState({
    expected: { search: { results: [{ id: 1, score: 0.1 }] } },
    actual: { search: { results: [{ id: 2, score: 0.9 }] } },
    snapshotIgnore: ['search.results.$.score'],
  });
  expect(result.differences).toEqual([{ path: 'search.results.0.id', expected: 1, actual: 2 }]);
});

test('diffState ignores a $ path when the value is not an array', () => {
  const result = diffState({
    expected: { rows: 'none' },
    actual: { rows: 'none' },
    snapshotIgnore: ['rows.$.score'],
  });
  expect(result.changed).toBe(false);
});

test('diffState does not mutate its inputs', () => {
  const expected = { form: { created_at: 'x', title: 'A' } };
  const actual = { form: { created_at: 'y', title: 'A' } };
  diffState({ expected, actual, snapshotIgnore: ['form.created_at'] });
  expect(expected).toEqual({ form: { created_at: 'x', title: 'A' } });
  expect(actual).toEqual({ form: { created_at: 'y', title: 'A' } });
});

test('diffState treats a missing state as empty', () => {
  expect(diffState({ expected: undefined, actual: {} }).changed).toBe(false);
});

test('diffState does not drift when a golden wrote an ignored array element as null', () => {
  // The golden is written through the same ignore, so its holes are JSON null;
  // the freshly captured side must be normalised the same way.
  const result = diffState({
    expected: JSON.parse(JSON.stringify({ rows: [undefined, undefined] })),
    actual: { rows: [{ id: 1 }, { id: 2 }] },
    snapshotIgnore: ['rows.$'],
  });
  expect(result.changed).toBe(false);
});
