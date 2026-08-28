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

import mergeObjects from './mergeObjects.js';

test('object with no media unchanged', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mergeObjects(obj)).toEqual(obj);
});

test('object with no media unchanged', () => {
  const obj1 = {
    a: 'a',
    b: 1,
    c: { a: 'b', e: 1 },
  };
  const obj2 = {
    b: 2,
    c: { a: 'a' },
  };
  expect(mergeObjects([obj1, obj2])).toEqual({
    a: 'a',
    b: 2,
    c: { a: 'a', e: 1 },
  });
});

test('object with all media', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'a',
    x: 0,
    sm: { b: 1 },
    md: { a: 'md', b: 2 },
    lg: { b: 3 },
    xl: { a: 'xl', b: 4 },
  };
  expect(mergeObjects([obj1, obj2])).toMatchInlineSnapshot(`
    Object {
      "a": "a",
      "lg": Object {
        "a": "lg",
        "b": 3,
      },
      "md": Object {
        "a": "md",
        "b": 2,
      },
      "sm": Object {
        "a": "sm",
        "b": 1,
      },
      "x": 0,
      "xl": Object {
        "a": "xl",
        "b": 4,
      },
    }
  `);
});

test('merge list of objects, larger indices overwrite smaller', () => {
  expect(mergeObjects([{ a: 1 }, { sm: { b: 2 } }, { sm: { b: 4 } }, { md: { c: 2 } }]))
    .toMatchInlineSnapshot(`
    Object {
      "a": 1,
      "md": Object {
        "c": 2,
      },
      "sm": Object {
        "b": 4,
      },
    }
  `);
});

test('merge objects with null', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mergeObjects([obj, null])).toEqual(obj);
  expect(mergeObjects([null, obj])).toEqual(obj);
});

test('mergeObjects does not mutate any of its inputs', () => {
  const obj1 = { a: 1, nested: { x: 1, deep: { p: 1 } }, arr: [1, 2] };
  const obj2 = { a: 2, nested: { y: 2, deep: { q: 2 } }, arr: [9] };
  const snapshot1 = JSON.parse(JSON.stringify(obj1));
  const snapshot2 = JSON.parse(JSON.stringify(obj2));
  mergeObjects([obj1, obj2]);
  expect(obj1).toEqual(snapshot1);
  expect(obj2).toEqual(snapshot2);
});

test('mergeObjects returns a new object that shares no reference with its inputs', () => {
  const obj1 = { nested: { x: 1 } };
  const obj2 = { nested: { y: 2 } };
  const merged = mergeObjects([obj1, obj2]);
  merged.nested.x = 'changed';
  expect(obj1.nested.x).toBe(1);
});

test('mergeObjects replaces arrays wholesale instead of merging them by index', () => {
  expect(mergeObjects([{ a: [1, 2, 3] }, { a: [9] }])).toEqual({ a: [9] });
});

test('mergeObjects replaces arrays of objects wholesale', () => {
  expect(
    mergeObjects([{ options: [{ value: true }, { value: null }] }, { options: [{ value: false }] }])
  ).toEqual({ options: [{ value: false }] });
});

test('mergeObjects merges disjoint nested keys from both sources', () => {
  expect(mergeObjects([{ a: { b: { c: 1 } } }, { a: { b: { d: 2 }, e: 3 } }])).toEqual({
    a: { b: { c: 1, d: 2 }, e: 3 },
  });
});

test('mergeObjects treats a Date value as a leaf and replaces it', () => {
  const early = new Date('2020-01-01T00:00:00.000Z');
  const late = new Date('2024-06-01T00:00:00.000Z');
  const merged = mergeObjects([{ at: early }, { at: late }]);
  expect(merged.at).toBe(late);
});

test('mergeObjects treats a RegExp value as a leaf and replaces it', () => {
  const merged = mergeObjects([{ pattern: /a/g }, { pattern: /b/i }]);
  expect(merged.pattern).toEqual(/b/i);
});

test('mergeObjects replaces a plain object with a non-plain value', () => {
  const date = new Date('2024-06-01T00:00:00.000Z');
  expect(mergeObjects([{ a: { b: 1 } }, { a: date }])).toEqual({ a: date });
});

test('mergeObjects replaces a function value as a leaf', () => {
  const fn = () => 'transformed';
  const merged = mergeObjects([{ transformRequest: undefined }, { transformRequest: fn }]);
  expect(merged.transformRequest).toBe(fn);
});

test('mergeObjects skips a __proto__ key in a merged value without polluting Object.prototype', () => {
  const merged = mergeObjects([{}, JSON.parse('{"__proto__":{"polluted":true}}')]);
  expect(Object.prototype.hasOwnProperty.call(merged, 'polluted')).toBe(false);
  expect(merged.polluted).toBeUndefined();
  expect({}.polluted).toBeUndefined();
  expect(Object.prototype.polluted).toBeUndefined();
});

test('mergeObjects skips a constructor key in a merged value', () => {
  const merged = mergeObjects([{ a: 1 }, JSON.parse('{"constructor":{"polluted":true}}')]);
  expect(Object.prototype.hasOwnProperty.call(merged, 'constructor')).toBe(false);
  expect(merged.constructor).toBe(Object);
  expect(merged).toEqual({ a: 1 });
});

test('mergeObjects skips a prototype key in a merged value', () => {
  const merged = mergeObjects([{ a: 1 }, JSON.parse('{"prototype":{"polluted":true}}')]);
  expect(Object.prototype.hasOwnProperty.call(merged, 'prototype')).toBe(false);
  expect(merged).toEqual({ a: 1 });
});

test('mergeObjects skips reserved keys nested inside a merged value', () => {
  const merged = mergeObjects([
    { a: { b: 1 } },
    JSON.parse('{"a":{"__proto__":{"polluted":true},"c":2}}'),
  ]);
  expect(merged).toEqual({ a: { b: 1, c: 2 } });
  expect({}.polluted).toBeUndefined();
});

test('mergeObjects returns non-array input unchanged', () => {
  expect(mergeObjects('foo')).toBe('foo');
  expect(mergeObjects(undefined)).toBeUndefined();
  expect(mergeObjects(null)).toBeNull();
  expect(mergeObjects(1)).toBe(1);
});

test('mergeObjects filters out entries that are not plain objects', () => {
  expect(mergeObjects([null, 1, 'a', [1, 2], undefined, { a: 1 }, new Date()])).toEqual({ a: 1 });
});

test('mergeObjects returns an empty object when no entry is a plain object', () => {
  expect(mergeObjects([])).toEqual({});
  expect(mergeObjects([null, undefined])).toEqual({});
});
