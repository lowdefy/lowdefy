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

import unset from './unset.js';
import { ReservedKeyError } from './ReservedKeyError.js';

test('unset a.1.b', () => {
  const obj = {
    a: [{ b: 2 }, { b: 5 }],
  };
  unset(obj, 'a.1.b');
  expect(obj).toEqual({ a: [{ b: 2 }, {}] });
});

test('unset a.b', () => {
  const obj = {
    a: { b: [] },
  };
  unset(obj, 'a.b');
  expect(obj).toEqual({ a: {} });
});

test('should update the given object when a property is unsetd:', () => {
  const obj = { a: 'b' };
  unset(obj, 'a');
  expect(obj).toEqual({});
});

test('should unset nested values:', () => {
  const one = { a: { b: { c: 'd' } } };
  unset(one, 'a.b');
  expect(one).toEqual({ a: {} });

  const two = { a: { b: { c: 'd' } } };
  unset(two, 'a.b.c');
  expect(two).toEqual({ a: { b: {} } });

  const three = { a: { b: { c: 'd', e: 'f' } } };
  unset(three, 'a.b.c');
  expect(three).toEqual({ a: { b: { e: 'f' } } });
});

test('should unset a literal dotted key when the path is unescaped:', () => {
  const three = { 'a.b': 'c', d: 'e' };
  expect(unset(three, 'a.b')).toBe(true);
  expect(three).toEqual({ d: 'e' });
});

test('should unset nested escaped values:', () => {
  const one = { a: { 'b.c': 'd' } };
  unset(one, 'a.b\\.c');
  expect(one).toEqual({ a: {} });

  const two = { 'a.b.c': 'd' };
  unset(two, 'a\\.b\\.c');
  expect(two).toEqual({});

  const three = { 'a.b': 'c', d: 'e' };
  unset(three, 'a\\.b');
  expect(three).toEqual({ d: 'e' });
});

describe('unset', () => {
  test('should update the given object when a property is unsetd:', () => {
    const obj = { a: 'b' };
    unset(obj, 'a');
    expect(obj).toEqual({});
  });

  test('should return true when a property is unsetd:', () => {
    const res = unset({ a: 'b' }, 'a');
    expect(res).toEqual(true);
  });

  test('should return true when the given property does not exist:', () => {
    const res = unset({ a: 'b' }, 'z');
    expect(res).toEqual(true);
  });

  test('should unset nested values:', () => {
    const one = { a: { b: { c: 'd' } } };
    unset(one, 'a.b');
    expect(one).toEqual({ a: {} });

    const two = { a: { b: { c: 'd' } } };
    unset(two, 'a.b.c');
    expect(two).toEqual({ a: { b: {} } });

    const three = { a: { b: { c: 'd', e: 'f' } } };
    unset(three, 'a.b.c');
    expect(three).toEqual({ a: { b: { e: 'f' } } });
  });

  test('should unset a literal dotted key when the path is unescaped:', () => {
    const three = { 'a.b': 'c', d: 'e' };
    expect(unset(three, 'a.b')).toBe(true);
    expect(three).toEqual({ d: 'e' });
  });

  test('should unset nested escaped values:', () => {
    const one = { a: { 'b.c': 'd' } };
    unset(one, 'a.b\\.c');
    expect(one).toEqual({ a: {} });

    const two = { 'a.b.c': 'd' };
    unset(two, 'a\\.b\\.c');
    expect(two).toEqual({});

    const three = { 'a.b': 'c', d: 'e' };
    unset(three, 'a\\.b');
    expect(three).toEqual({ d: 'e' });
  });

  test('should throw an error when invalid args are passed:', () => {
    expect(() => {
      unset();
    }).toThrow('expected an object.');
  });
});

describe('unset non-object root', () => {
  test('unset throws a TypeError when the root is null', () => {
    expect(() => unset(null, 'x')).toThrow(new TypeError('expected an object.'));
  });

  test('unset throws a TypeError when the root is undefined', () => {
    expect(() => unset(undefined, 'x')).toThrow(new TypeError('expected an object.'));
  });

  test('unset throws a TypeError when the root is a number', () => {
    expect(() => unset(42, 'x')).toThrow(new TypeError('expected an object.'));
  });
});

describe('unset missing paths', () => {
  test('unset returns true and does not throw when the path is missing entirely', () => {
    const obj = {};
    expect(unset(obj, 'a.b.c')).toBe(true);
    expect(obj).toEqual({});
  });

  test('unset returns true and leaves the object unchanged when an intermediate is a primitive', () => {
    const obj = { a: 1 };
    expect(unset(obj, 'a.b.c')).toBe(true);
    expect(obj).toEqual({ a: 1 });
  });

  test('unset returns true when an intermediate is null', () => {
    const obj = { a: null };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(obj).toEqual({ a: null });
  });

  test('unset does not traverse inherited properties', () => {
    const obj = { a: 1 };
    expect(unset(obj, 'toString.name')).toBe(true);
    expect(Object.prototype.toString.name).toBe('toString');
  });

  test('unset returns true when a non-string path is given', () => {
    const obj = { a: 1 };
    expect(unset(obj, undefined)).toBe(true);
    expect(obj).toEqual({ a: 1 });
  });
});

describe('unset reserved keys', () => {
  test('unset throws ReservedKeyError for a top level __proto__ path', () => {
    expect(() => unset({}, '__proto__')).toThrow(ReservedKeyError);
    try {
      unset({}, '__proto__');
    } catch (error) {
      expect(error.segment).toBe('__proto__');
      expect(error.name).toBe('ReservedKeyError');
    }
  });

  test('unset throws ReservedKeyError when __proto__ is a middle segment', () => {
    expect(() => unset({}, 'a.__proto__.b')).toThrow(ReservedKeyError);
    try {
      unset({}, 'a.__proto__.b');
    } catch (error) {
      expect(error.segment).toBe('__proto__');
    }
  });

  test('unset throws ReservedKeyError for a constructor segment', () => {
    expect(() => unset({}, 'a.constructor')).toThrow(ReservedKeyError);
    try {
      unset({}, 'a.constructor');
    } catch (error) {
      expect(error.segment).toBe('constructor');
    }
  });

  test('unset throws ReservedKeyError for a prototype segment', () => {
    expect(() => unset({}, 'a.prototype.b')).toThrow(ReservedKeyError);
  });

  test('unset throws ReservedKeyError for __defineGetter__', () => {
    expect(() => unset({}, '__defineGetter__')).toThrow(ReservedKeyError);
  });

  test('unset throws ReservedKeyError even when the reserved key is an own property', () => {
    const obj = {};
    Object.defineProperty(obj, '__proto__', {
      configurable: true,
      enumerable: true,
      value: 1,
      writable: true,
    });
    expect(() => unset(obj, '__proto__')).toThrow(ReservedKeyError);
    expect(Object.prototype.hasOwnProperty.call(obj, '__proto__')).toBe(true);
  });
});

describe('unset escaped paths', () => {
  // Regression: the previous implementation only unescaped the trailing run of
  // segments and then walked the remaining segments raw, crashing on
  // `obj['b\\']` being undefined.
  test('unset deletes through an escaped middle segment', () => {
    const obj = { a: { 'b.c': { d: 1, e: 2 } } };
    expect(unset(obj, 'a.b\\.c.d')).toBe(true);
    expect(obj).toEqual({ a: { 'b.c': { e: 2 } } });
  });

  test('unset deletes an escaped inner key', () => {
    const obj = { a: { 'b.c': 1 } };
    expect(unset(obj, 'a.b\\.c')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(obj.a, 'b.c')).toBe(false);
    expect(obj).toEqual({ a: {} });
  });

  test('unset deletes a literal dotted top level key when the dot is escaped', () => {
    const obj = { 'a.b': 1 };
    expect(unset(obj, 'a\\.b')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(obj, 'a.b')).toBe(false);
    expect(obj).toEqual({});
  });

  // A miss on the strict segment falls back to a literal dotted key at the same level.
  test('unset deletes a literal dotted top level key when the dot is not escaped', () => {
    const obj = { 'a.b': 1 };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(obj).toEqual({});
  });

  test('unset walks nested segments when no raw key matches the path', () => {
    const obj = { a: { b: 1 } };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(obj.a, 'b')).toBe(false);
  });
});

describe('unset dotted key rejoin', () => {
  test('unset deletes a literal dotted key nested below a strict segment', () => {
    const obj = { attributes: { 'a.b': 1 } };
    expect(unset(obj, 'attributes.a.b')).toBe(true);
    expect(obj).toEqual({ attributes: {} });
  });

  test('unset deletes the nested value when both a strict segment and a dotted key exist', () => {
    const obj = { a: { b: 1 }, 'a.b': 2 };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(obj).toEqual({ a: {}, 'a.b': 2 });
  });

  test('unset matches the shortest joined key first', () => {
    const obj = { 'a.b': { c: 1 }, 'a.b.c': 2 };
    expect(unset(obj, 'a.b.c')).toBe(true);
    expect(obj).toEqual({ 'a.b': {}, 'a.b.c': 2 });
  });

  test('unset does not backtrack to a longer joined key after a match', () => {
    const obj = { 'a.b': {}, 'a.b.c': 1 };
    expect(unset(obj, 'a.b.c')).toBe(true);
    expect(obj).toEqual({ 'a.b': {}, 'a.b.c': 1 });
  });

  test('unset is a no-op when no strict or joined key matches', () => {
    const obj = {};
    expect(unset(obj, 'a.b.c')).toBe(true);
    expect(obj).toEqual({});
  });

  test('unset is a no-op when an intermediate is a primitive', () => {
    const obj = { a: 1 };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(obj).toEqual({ a: 1 });
  });

  // The strict segment wins even when it cannot be traversed - a present scalar `a` blocks the
  // rejoin to the literal `a.b` key, and there is no backtracking to try it.
  test('unset is a no-op when a strict scalar segment coexists with a literal dotted key', () => {
    const obj = { a: 1, 'a.b': 2 };
    expect(unset(obj, 'a.b')).toBe(true);
    expect(obj).toEqual({ a: 1, 'a.b': 2 });
  });

  test('unset deletes through a rejoin match followed by ordinary strict descent', () => {
    const obj = { 'a.b': { c: { d: 1 } } };
    expect(unset(obj, 'a.b.c.d')).toBe(true);
    expect(obj).toEqual({ 'a.b': { c: {} } });
  });
});
