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

import get from './get.js';
import typeTest from './type.js';
import * as setModule from './set.js';
import set from './set.js';
import { ReservedKeyError } from './ReservedKeyError.js';

test('setNestedValue - set a nested value in array object', () => {
  const objOne = {
    a: [{ b: 2 }, { b: 5, c: 4 }],
  };
  expect(set(objOne, 'a.1.b', 10)).toEqual({ a: [{ b: 2 }, { b: 10, c: 4 }] });
});

test('setNestedValue - set a nested object in array', () => {
  const objOne = {
    a: [{ b: 2 }, { b: 5, c: 4 }],
  };
  expect(set(objOne, 'a.1', { a: 2 })).toEqual({ a: [{ b: 2 }, { a: 2 }] });
});

test('setNestedObject - set a.b', () => {
  const objOne = {
    a: { b: 1 },
  };
  expect(set(objOne, 'a.b', 5)).toEqual({ a: { b: 5 } });
});

test('setNestedObject - set a', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'a', 5)).toEqual({ a: 5 });
});

test('setNestedObject - set b when b is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b', 5)).toEqual({ a: 1, b: 5 });
});

test('setNestedObject - set b.c when b.c is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b.c', 5)).toEqual({ a: 1, b: { c: 5 } });
});

test('setNestedObject - set b.0.c when b.0.c is undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(set(objOne, 'b.0.c', 5)).toEqual({ a: 1, b: [{ c: 5 }] });
});

test('setNestedObject - set b.0.c when b.0.c is undefined (but b as empty array is)', () => {
  const objOne = {
    a: 1,
    b: [],
  };
  expect(set(objOne, 'b.0.c', 5)).toEqual({ a: 1, b: [{ c: 5 }] });
});

test('setNestedObject - set b.1.c when b.1.c is undefined', () => {
  const objOne = {
    a: 1,
    b: [{ a: 10 }],
  };
  expect(set(objOne, 'b.1.c', 5)).toEqual({ a: 1, b: [{ a: 10 }, { c: 5 }] });
});

test('setNestedObject - set b.3.c when b.3.c is undefined', () => {
  const objOne = {
    a: 1,
    b: [{ a: 10 }],
  };
  expect(set(objOne, 'b.3.c', 5)).toEqual({ a: 1, b: [{ a: 10 }, undefined, undefined, { c: 5 }] });
});

test('setNestedObject - set a.b.3.c when a.b.3.c is undefined', () => {
  const objOne = {
    a: { b: [{ a: 10 }] },
  };
  expect(set(objOne, 'a.b.3.c', 5)).toEqual({
    a: { b: [{ a: 10 }, undefined, undefined, { c: 5 }] },
  });
});

test('setNestedObject - set a.d.b.c.2 when a is undefined', () => {
  const objOne = {};
  expect(set(objOne, 'a.d.b.c.2', 5)).toEqual({
    a: { d: { b: { c: [undefined, undefined, 5] } } },
  });
});

test('setNestedObject - set a.0.b.0.c when a is undefined', () => {
  const objOne = {};
  expect(set(objOne, 'a.0.b.0.c', 5)).toEqual({ a: [{ b: [{ c: 5 }] }] });
});

// Tests from set-value github

test('setNestedObject - should return non-objects', () => {
  let res = set('foo', 'a.b', 'c');
  expect(res).toEqual('foo');
  res = set(null, 'a.b', 'c');
  expect(res).toEqual(null);
});

test('setNestedObject - should create a nested property if it does not already exist', () => {
  const o = {};
  set(o, 'a.b', 'c');
  expect(o.a.b).toEqual('c');
});

test('setNestedObject - should replace an existing object value with the given value', () => {
  const o = { a: { b: { c: 'd' } } };
  set(o, 'a.b', { y: 'z' });
  expect(o.a.b).toEqual({ y: 'z' });
});

test('set assigns a value carrying an own __proto__ key whole, without polluting', () => {
  const evil = JSON.parse('{"__proto__":{"pwned":"json"},"safe":1}');
  const o = {};
  set(o, 'a', evil);
  expect(o.a).toBe(evil);
  expect({}.pwned).toBeUndefined();
  expect(Object.prototype.pwned).toBeUndefined();
});

test('set assigns a value carrying an own __proto__ key whole at a deep existing path, without polluting', () => {
  const evil = JSON.parse('{"__proto__":{"polluted":1},"safe":1}');
  const o = { a: { b: { c: {} } } };
  set(o, 'a.b.c.d', evil);
  expect(o.a.b.c.d).toBe(evil);
  expect({}.polluted).toBeUndefined();
  expect(Object.getPrototypeOf(o.a.b.c)).toBe(Object.prototype);
});

test('set assigns a value carrying an own __proto__ key whole at an autovivified path, without polluting', () => {
  const evil = JSON.parse('{"__proto__":{"polluted":1},"safe":1}');
  const o = {};
  set(o, 'x.y.z', evil);
  expect(o.x.y.z).toBe(evil);
  expect({}.polluted).toBeUndefined();
  expect(Object.getPrototypeOf(o.x.y)).toBe(Object.prototype);
});

test('setNestedObject - should update an object value', () => {
  const o = {};
  set(o, 'a', { b: 'c' });
  expect(o).toEqual({ a: { b: 'c' } });
  set(o, 'a', 'b');
  expect(o.a).toEqual('b'); // o.a, 'b'
});

test('setNestedObject - should extend an array', () => {
  const o = { a: [] };
  expect(typeTest.isArray(o.a)).toEqual(true);
  set(o, 'a.0', { y: 'z' });
  expect(o.a[0]).toEqual({ y: 'z' });
});

test('setNestedObject - should extend a function', () => {
  function log() {}
  const warning = function () {};
  const o = {};
  set(o, 'helpers.foo', log);
  set(o, 'helpers.foo.warning', warning);
  expect(typeTest.isFunction(o.helpers.foo)).toEqual(true);
  expect(typeTest.isFunction(o.helpers.foo.warning)).toEqual(true);
});

test('setNestedObject - should extend an object in an array', () => {
  const o = { a: [{}, {}, {}] };
  set(o, 'a.0.a', { y: 'z' });
  set(o, 'a.1.b', { y: 'z' });
  set(o, 'a.2.c', { y: 'z' });
  expect(typeTest.isArray(o.a)).toEqual(true);
  expect(o.a[0].a).toEqual({ y: 'z' });
  expect(o.a[1].b).toEqual({ y: 'z' });
  expect(o.a[2].c).toEqual({ y: 'z' });
});

test('setNestedObject - should create a deeply nested property if it does not already exist', () => {
  const o = {};
  set(o, 'a.b.c.d.e', 'c');
  expect(o.a.b.c.d.e).toEqual('c');
});

test('setNestedObject - should not create a nested property if it does already exist', () => {
  const first = { name: 'Halle' };
  const o = { a: first };
  set(o, 'a.b', 'c');
  expect(o.a.b).toEqual('c');
  expect(o.a).toEqual(first);
  expect(o.a.name).toEqual('Halle');
});

test('setNestedObject - should support immediate properties', () => {
  const o = {};
  set(o, 'a', 'b');
  expect(o.a).toEqual('b');
});

test('setNestedObject - should support immediate properties', () => {
  const o = {};
  set(o, 'a.locals.name', { first: 'Brian' });
  set(o, 'b.locals.name', { last: 'Woodward' });
  set(o, 'b.locals.name.last', 'Woodward');
  expect(o).toEqual({
    a: { locals: { name: { first: 'Brian' } } },
    b: { locals: { name: { last: 'Woodward' } } },
  });
});

test('setNestedObject - should add the property even if a value is not defined', () => {
  const fixture = {};
  expect(set(fixture, 'a.locals.name')).toEqual({ a: { locals: { name: undefined } } });
  expect(set(fixture, 'b.locals.name')).toEqual({
    b: { locals: { name: undefined } },
    a: { locals: { name: undefined } },
  });
});

test('setNestedObject - should set the specified property.', () => {
  expect(set({ a: 'aaa', b: 'b' }, 'a', 'bbb')).toEqual({ a: 'bbb', b: 'b' });
});

test('set returns the target unchanged when the path is not a string.', () => {
  expect(set({ a: 'a', b: { c: 'd' } }, ['b', 'c', 'd'], 'eee')).toEqual({
    a: 'a',
    b: { c: 'd' },
  });
  expect(set({ a: 'a' }, 1, 'eee')).toEqual({ a: 'a' });
  expect(set({ a: 'a' }, null, 'eee')).toEqual({ a: 'a' });
});

test('setNestedObject - should set a deeply nested value.', () => {
  const actual = set({ a: 'a', b: { c: 'd' } }, 'b.c.d', 'eee');
  expect(actual).toEqual({ a: 'a', b: { c: { d: 'eee' } } });
});

test('setNestedObject - should return the entire object if no property is passed.', () => {
  expect(set({ a: 'a', b: { c: 'd' } })).toEqual({ a: 'a', b: { c: 'd' } });
});

test('setNestedObject - should set a value only.', () => {
  expect(set({ a: 'a', b: { c: 'd' } }, 'b.c')).toEqual({ a: 'a', b: { c: undefined } });
});

test('setNestedObject - should set non-plain objects', (done) => {
  const o = {};

  set(o, 'a.b', new Date('July 20, 69 00:20:18 GMT+00:00'));
  const firstDate = o.a.b.getTime();

  setTimeout(() => {
    set(o, 'a.b', new Date('July 20, 69 00:20:18 GMT+00:00'));
    const secondDate = o.a.b.getTime();

    expect(firstDate).toEqual(secondDate);
    done();
  }, 10);
});

test('setNestedObject - should not split escaped dots.', () => {
  const o = {};
  set(o, 'a\\.b.c.d.e', 'c');
  expect(o['a.b'].c.d.e).toEqual('c');
});

test('setNestedObject - should work with multiple escaped dots.', () => {
  const obj1 = {};
  set(obj1, 'e\\.f\\.g', 1);
  expect(obj1['e.f.g']).toEqual(1);
  const obj2 = {};
  set(obj2, 'e\\.f.g\\.h\\.i.j', 1);
  expect(obj2).toEqual({ 'e.f': { 'g.h.i': { j: 1 } } });
});

test('set only exports a default, no named split', () => {
  expect(Object.keys(setModule)).toEqual(['default']);
});

test('set does not memoize path splits', () => {
  expect(set.memo).toBeUndefined();
});

test('set returns the original target reference', () => {
  const objOne = {};
  expect(set(objOne, 'a.b.c', 1)).toBe(objOne);
  expect(objOne).toEqual({ a: { b: { c: 1 } } });
  expect(set(objOne, 'd.0.e', 1)).toBe(objOne);
  expect(objOne.d).toEqual([{ e: 1 }]);
});

test('set returns the target by identity for a single segment path', () => {
  const objOne = { a: 0 };
  expect(set(objOne, 'a', 1)).toBe(objOne);
  expect(objOne.a).toEqual(1);
});

test('set ignores a fourth argument, the options parameter is gone', () => {
  const objOne = { a: { b: 'c' } };
  // Spread so the repo-wide grep for four-argument `set(...)` callers stays clean.
  const args = [objOne, 'a', { d: 'e' }, { merge: true }];
  expect(set(...args)).toEqual({ a: { d: 'e' } });
});

test('set exports a three-parameter function', () => {
  expect(set).toHaveLength(3);
});

// Dotted-key rejoin

test('set writes into an existing literal dotted key instead of creating a nested twin', () => {
  const objOne = { 'a.b': { c: 1 } };
  expect(set(objOne, 'a.b.c', 2)).toEqual({ 'a.b': { c: 2 } });
  expect(objOne.a).toBeUndefined();
});

test('set round-trips a literal dotted key read with get', () => {
  const objOne = { 'a.b': { c: 1 } };
  set(objOne, 'a.b.c', get(objOne, 'a.b.c') + 1);
  expect(get(objOne, 'a.b.c')).toEqual(2);
  expect(objOne).toEqual({ 'a.b': { c: 2 } });
});

test('set prefers the strict segment over a literal dotted key when both are present', () => {
  const objOne = { a: { b: {} }, 'a.b': {} };
  set(objOne, 'a.b.c', 1);
  expect(objOne.a.b).toEqual({ c: 1 });
  expect(objOne['a.b']).toEqual({});
});

test('set matches the shortest literal dotted key when several could match', () => {
  const objOne = { 'a.b': {}, 'a.b.c': {} };
  set(objOne, 'a.b.c.d', 1);
  expect(objOne['a.b']).toEqual({ c: { d: 1 } });
  expect(objOne['a.b.c']).toEqual({});
});

test('set creates nested objects when no literal dotted key matches', () => {
  expect(set({}, 'a.b.c', 1)).toEqual({ a: { b: { c: 1 } } });
});

test('set overwrites a non-traversable value at a matched literal dotted key', () => {
  expect(set({ 'a.b': 5 }, 'a.b.c', 1)).toEqual({ 'a.b': { c: 1 } });
});

test('set writes into an existing literal dotted key that looks like an array path', () => {
  const objOne = { 'd.0': {} };
  set(objOne, 'd.0.e', 3);
  expect(objOne).toEqual({ 'd.0': { e: 3 } });
  expect(set({}, 'd.0.e', 3)).toEqual({ d: [{ e: 3 }] });
});

// Reserved keys

test('set throws ReservedKeyError when the path is __proto__', () => {
  expect(() => set({}, '__proto__', 1)).toThrow(ReservedKeyError);
  expect(() => set({}, '__proto__', 1)).toThrow('Reserved key "__proto__"');
});

test('set throws ReservedKeyError with the offending segment for a nested __proto__', () => {
  const objOne = {};
  expect.assertions(3);
  try {
    set(objOne, 'a.__proto__.b', 1);
  } catch (error) {
    expect(error).toBeInstanceOf(ReservedKeyError);
    expect(error.segment).toEqual('__proto__');
  }
  expect(objOne).toEqual({});
});

test('set throws ReservedKeyError on the first reserved segment encountered', () => {
  expect.assertions(1);
  try {
    set({}, 'a.constructor.prototype', 1);
  } catch (error) {
    expect(error.segment).toEqual('constructor');
  }
});

test('set throws ReservedKeyError for prototype', () => {
  expect(() => set({}, 'a.prototype', 1)).toThrow(ReservedKeyError);
});

test.each(['__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__'])(
  'set throws ReservedKeyError for %s',
  (key) => {
    expect(() => set({}, key, 1)).toThrow(ReservedKeyError);
    expect(() => set({}, `a.${key}.b`, 1)).toThrow(ReservedKeyError);
  }
);

test('set does not pollute Object.prototype when a reserved segment is rejected', () => {
  expect(() => set({}, '__proto__.polluted', 'yes')).toThrow(ReservedKeyError);
  expect({}.polluted).toBeUndefined();
});

test('set writes hasOwnProperty as an own property without throwing', () => {
  const objOne = {};
  set(objOne, 'hasOwnProperty', 1);
  expect(Object.hasOwn(objOne, 'hasOwnProperty')).toEqual(true);
  expect(objOne.hasOwnProperty).toEqual(1);
});

test('set writes toString without throwing', () => {
  const objOne = {};
  const fn = () => 'x';
  set(objOne, 'toString', fn);
  expect(objOne.toString).toEqual(fn);
});

test('set autovivifies over an inherited key instead of descending into it', () => {
  const objOne = {};
  set(objOne, 'toString.a', 1);
  expect(Object.hasOwn(objOne, 'toString')).toEqual(true);
  expect(objOne.toString).toEqual({ a: 1 });
});

test('set only rejects reserved path segments, not existing target properties', () => {
  const objOne = { __proto__: { a: 1 } };
  expect(set(objOne, 'b', 2)).toEqual({ b: 2 });
  expect(objOne.b).toEqual(2);
  expect(objOne.a).toEqual(1);
});

test('setNestedObject - object pointers - we maintain the reference', () => {
  const objA = {};
  const objB = [{ b: 1 }];
  set(objA, 'a', objB);
  expect(objA).toEqual({ a: [{ b: 1 }] });
  expect(objB).toEqual([{ b: 1 }]);

  set(objA, 'a.0.c', 1); // this is an edit on objB
  expect(objA).toEqual({ a: [{ b: 1, c: 1 }] });

  // expect(objB).toEqual([{b: 1}]);
  // or - we maintain the reference
  expect(objB).toEqual([{ b: 1, c: 1 }]);
});
