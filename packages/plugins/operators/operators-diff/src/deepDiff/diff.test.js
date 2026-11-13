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

import { expect, test } from 'vitest';

import diff from './diff.js';

// Expected output below was taken from deep-diff 1.0.2, the package this code was
// copied from. JSON.stringify is used where property order matters.

test('diff returns undefined when lhs and rhs are the same', () => {
  expect(diff({ a: 1, b: [1, { c: 2 }] }, { a: 1, b: [1, { c: 2 }] })).toBe(undefined);
  expect(diff({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(undefined);
  expect(diff(null, null)).toBe(undefined);
  expect(diff(undefined, undefined)).toBe(undefined);
});

test('diff builds read-only records through deep-diff constructors with fields in a fixed order', () => {
  const [edit, added, deleted, array] = diff({ e: 1, d: 1, a: [] }, { e: 2, n: 1, a: [1] }).sort(
    (x, y) => 'ENDA'.indexOf(x.kind) - 'ENDA'.indexOf(y.kind)
  );
  expect(edit.constructor.name).toBe('DiffEdit');
  expect(added.constructor.name).toBe('DiffNew');
  expect(deleted.constructor.name).toBe('DiffDeleted');
  expect(array.constructor.name).toBe('DiffArray');
  expect(array.item.constructor.name).toBe('DiffNew');
  expect(Object.keys(edit)).toEqual(['kind', 'path', 'lhs', 'rhs']);
  expect(Object.keys(added)).toEqual(['kind', 'path', 'rhs']);
  expect(Object.keys(deleted)).toEqual(['kind', 'path', 'lhs']);
  expect(Object.keys(array)).toEqual(['kind', 'path', 'index', 'item']);
  expect(Object.keys(array.item)).toEqual(['kind', 'rhs']);
  expect(Object.getOwnPropertyDescriptor(edit, 'lhs')).toEqual({
    value: 1,
    enumerable: true,
    writable: false,
    configurable: false,
  });
});

test('diff leaves path out of top-level records', () => {
  expect(JSON.stringify(diff(1, 2))).toBe('[{"kind":"E","lhs":1,"rhs":2}]');
  expect(JSON.stringify(diff('abc', undefined))).toBe('[{"kind":"D","lhs":"abc"}]');
  expect(JSON.stringify(diff(undefined, { a: 1 }))).toBe('[{"kind":"N","rhs":{"a":1}}]');
});

test('diff reports nested edits, additions and deletions with their paths', () => {
  expect(JSON.stringify(diff({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }))).toBe(
    '[{"kind":"E","path":["a","b","c"],"lhs":1,"rhs":2}]'
  );
  expect(
    JSON.stringify(
      diff(
        { name: 'Ann', tags: ['a', 'b'], address: { city: 'CPT', zip: null } },
        { name: 'Anne', tags: ['a'], address: { city: 'JHB' }, phone: '123' }
      )
    )
  ).toBe(
    '[{"kind":"E","path":["name"],"lhs":"Ann","rhs":"Anne"},' +
      '{"kind":"A","path":["tags"],"index":1,"item":{"kind":"D","lhs":"b"}},' +
      '{"kind":"E","path":["address","city"],"lhs":"CPT","rhs":"JHB"},' +
      '{"kind":"D","path":["address","zip"],"lhs":null},' +
      '{"kind":"N","path":["phone"],"rhs":"123"}]'
  );
});

test('diff reports a growing array as A records from the last index down', () => {
  expect(JSON.stringify(diff({ a: [1, 2] }, { a: [1, 2, 3, 4] }))).toBe(
    '[{"kind":"A","path":["a"],"index":3,"item":{"kind":"N","rhs":4}},' +
      '{"kind":"A","path":["a"],"index":2,"item":{"kind":"N","rhs":3}}]'
  );
});

test('diff reports a shrinking array as A records from the last index down', () => {
  expect(JSON.stringify(diff({ a: [1, 2, 3, 4] }, { a: [1, 2] }))).toBe(
    '[{"kind":"A","path":["a"],"index":3,"item":{"kind":"D","lhs":4}},' +
      '{"kind":"A","path":["a"],"index":2,"item":{"kind":"D","lhs":3}}]'
  );
});

test('diff compares reordered arrays by index, from the last index down', () => {
  expect(JSON.stringify(diff([1, 2, 3], [3, 2, 1]))).toBe(
    '[{"kind":"E","path":[2],"lhs":3,"rhs":1},{"kind":"E","path":[0],"lhs":1,"rhs":3}]'
  );
});

test('diff walks into objects in arrays and arrays in arrays', () => {
  expect(JSON.stringify(diff([{ a: 1 }, { b: 2 }], [{ a: 2 }, { b: 2, c: 3 }]))).toBe(
    '[{"kind":"N","path":[1,"c"],"rhs":3},{"kind":"E","path":[0,"a"],"lhs":1,"rhs":2}]'
  );
  expect(JSON.stringify(diff([[1, 2], [3]], [[1], [3, 4]]))).toBe(
    '[{"kind":"A","path":[1],"index":1,"item":{"kind":"N","rhs":4}},' +
      '{"kind":"A","path":[0],"index":1,"item":{"kind":"D","lhs":2}}]'
  );
});

test('diff reports a change of type as an edit of the whole value', () => {
  expect(JSON.stringify(diff({ a: 1, b: {}, c: [1] }, { a: '1', b: [], c: { 0: 1 } }))).toBe(
    '[{"kind":"E","path":["a"],"lhs":1,"rhs":"1"},' +
      '{"kind":"E","path":["b"],"lhs":{},"rhs":[]},' +
      '{"kind":"E","path":["c"],"lhs":[1],"rhs":{"0":1}}]'
  );
  expect(JSON.stringify(diff({ a: { b: 1 }, c: null }, { a: null, c: { d: 1 } }))).toBe(
    '[{"kind":"E","path":["a"],"lhs":{"b":1},"rhs":null},' +
      '{"kind":"E","path":["c"],"lhs":null,"rhs":{"d":1}}]'
  );
});

test('diff treats a key set to undefined as present', () => {
  const deleted = diff({ a: undefined }, {});
  expect(deleted).toEqual([{ kind: 'D', path: ['a'], lhs: undefined }]);
  expect('lhs' in deleted[0]).toBe(true);
  const added = diff({}, { a: undefined });
  expect(added).toEqual([{ kind: 'N', path: ['a'], rhs: undefined }]);
  expect('rhs' in added[0]).toBe(true);
  expect(diff({ a: undefined }, { a: undefined })).toBe(undefined);
});

test('diff treats NaN as equal to NaN', () => {
  expect(diff({ a: NaN }, { a: NaN })).toBe(undefined);
  expect(diff({ a: 1 }, { a: NaN })).toEqual([{ kind: 'E', path: ['a'], lhs: 1, rhs: NaN }]);
});

test('diff compares dates by time and returns the date objects', () => {
  const lhs = new Date(0);
  const rhs = new Date(1);
  expect(diff({ d: new Date(0) }, { d: new Date(0) })).toBe(undefined);
  const result = diff({ d: lhs }, { d: rhs });
  expect(result).toEqual([{ kind: 'E', path: ['d'], lhs, rhs }]);
  expect(result[0].lhs).toBe(lhs);
  expect(result[0].rhs).toBe(rhs);
});

test('diff compares regular expressions as strings', () => {
  expect(JSON.stringify(diff({ r: /a/g, s: /a/ }, { r: /a/i, s: /a/ }))).toBe(
    '[{"kind":"E","path":["r"],"lhs":"/a/g","rhs":"/a/i"}]'
  );
});

test('diff stops at circular references', () => {
  const lhs = { x: 1 };
  lhs.self = lhs;
  const rhs = { x: 2 };
  rhs.self = rhs;
  const result = diff(lhs, rhs);
  expect(result.map((record) => [record.kind, record.path])).toEqual([
    ['E', ['x']],
    ['E', ['self']],
  ]);
  expect(result[1].lhs).toBe(lhs);
  expect(result[1].rhs).toBe(rhs);

  const circular = { x: 1 };
  circular.self = circular;
  const fromFlat = diff({ x: 1, self: { x: 1 } }, circular);
  expect(fromFlat.map((record) => [record.kind, record.path])).toEqual([['N', ['self', 'self']]]);
  expect(fromFlat[0].rhs).toBe(circular);
});
