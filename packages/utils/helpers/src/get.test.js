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

// The MIT License (MIT)

// Copyright (c) 2014-2018, Jon Schlinkert.
// https://www.npmjs.com/package/get-value

import diff from 'jest-diff';
import get from './get.js';
import set from './set.js';
import unset from './unset.js';
import { ReservedKeyError } from './ReservedKeyError.js';

const expectToEqual = (result, value) => {
  expect(result).toEqual(value);
};

const expectToStrictEqual = (result, value) => {
  expect(result).toStrictEqual(value);
};

expect.extend({
  deepStrictEqual(received, expected) {
    const options = {};
    const pass = this.equals(received, expected);
    const message = pass
      ? () =>
          `${this.utils.matcherHint('deepStrictEqual', undefined, undefined, options)}\n\n` +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return `${this.utils.matcherHint('deepStrictEqual', undefined, undefined, options)}\n\n${
            diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(
                  expected
                )}\nReceived: ${this.utils.printReceived(received)}`
          }`;
        };

    return { actual: received, message, pass };
  },
});

const expectDeepStrictEqual = (result, value) => {
  expect(result).deepStrictEqual(value);
};

test('get a', () => {
  const objOne = {
    a: 1,
  };
  expect(get(objOne, 'a')).toEqual(1);
});

test('get undefined', () => {
  const objOne = {
    a: 1,
  };
  expect(get(objOne, 'b')).toEqual(undefined);
});

test('get a.b', () => {
  const objOne = {
    a: { b: 1 },
  };
  expect(get(objOne, 'a.b')).toEqual(1);
});

test('get --b', () => {
  const objOne = {
    '--b': 10,
  };
  expect(get(objOne, '--b')).toEqual(10);
});

test('get a.--b', () => {
  const objOne = {
    a: { '--b': 1 },
  };
  expect(get(objOne, 'a.--b')).toEqual(1);
});

test('get a.undefined', () => {
  const objOne = {
    a: { b: 1 },
  };
  expect(get(objOne, 'a.c')).toEqual(undefined);
});

test('get a.0.b in array', () => {
  const objOne = {
    a: [{ b: 1 }, { c: 2 }],
  };
  expect(get(objOne, 'a.1.c')).toEqual(2);
});

test('return alt value', () => {
  const objOne = {
    a: 1,
  };
  expect(get(objOne, 'b', 3)).toEqual(3);
});

test('return null value', () => {
  const objOne = {
    a: null,
  };
  expect(get(objOne, 'a', 2)).toEqual(null);
});

test('return arr', () => {
  const objOne = {
    a: { b: [] },
  };
  expect(get(objOne, 'a.b')).toEqual([]);
});

test('get by array index', () => {
  const arr = [0, 1, 2];
  expect(get(arr, 1)).toEqual(1);
});

// tests from
// https://github.com/jonschlinkert/get-value/blob/master/test/units.js

test('should return undefined when non-object given as the first argument', () => {
  expect(get(null)).toEqual(undefined);
  expect(get('foo')).toEqual(undefined);
  expect(get(['a'])).toEqual(undefined);
  expect(get({ a: 'a' })).toEqual(undefined);
});

test('should return default value when non-object given as the first argument with default value', () => {
  expect(get(null, undefined, { default: 'default' })).toEqual('default');
  expect(get('foo', undefined, { default: 'default' })).toEqual('default');
  expect(get(['a'], undefined, { default: 'default' })).toEqual('default');
  expect(get({ a: 'a' }, undefined, { default: 'default' })).toEqual('default');
});

test('should get a value', () => {
  expectToEqual(get({ a: 'a', b: { c: 'd' } }, 'a'), 'a');
  expectToEqual(get({ a: 'a', b: { c: 'd' } }, 'b.c'), 'd');
  expectToEqual(get({ foo: 'bar' }, 'foo.bar'), undefined);
});

test('should get a property that has dots in the key', () => {
  expectToEqual(get({ 'a.b': 'c' }, 'a.b'), 'c');
});

test('should support using dot notation to get nested values', () => {
  const fixture = {
    a: { locals: { name: { first: 'Brian' } } },
    b: { locals: { name: { last: 'Woodward' } } },
    c: { locals: { paths: ['a.txt', 'b.js', 'c.hbs'] } },
  };
  expectDeepStrictEqual(get(fixture, 'a.locals.name'), { first: 'Brian' });
  expectDeepStrictEqual(get(fixture, 'b.locals.name'), { last: 'Woodward' });
  expectToStrictEqual(get(fixture, 'b.locals.name.last'), 'Woodward');
  expectToStrictEqual(get(fixture, 'c.locals.paths.0'), 'a.txt');
  expectToStrictEqual(get(fixture, 'c.locals.paths.1'), 'b.js');
  expectToStrictEqual(get(fixture, 'c.locals.paths.2'), 'c.hbs');
  expectToStrictEqual(get(fixture, 'c.locals.paths.0'), 'a.txt');
  expectToStrictEqual(get(fixture, 'c.locals.paths.1'), 'b.js');
  expectToStrictEqual(get(fixture, 'c.locals.paths.2'), 'c.hbs');
});

test('should support a default value as the last argument', () => {
  const fixture = { foo: { c: { d: 'e' } } };
  expectToEqual(get(fixture, 'foo.bar.baz', 'quz'), 'quz');
  expectToEqual(get(fixture, 'foo.bar.baz', true), true);
  expectToEqual(get(fixture, 'foo.bar.baz', false), false);
  expectToEqual(get(fixture, 'foo.bar.baz', null), null);
});

test('should support options.default', () => {
  const fixture = { foo: { c: { d: 'e' } } };
  expectToEqual(get(fixture, 'foo.bar.baz', { default: 'qux' }), 'qux');
  expectToEqual(get(fixture, 'foo.bar.baz', { default: true }), true);
  expectToEqual(get(fixture, 'foo.bar.baz', { default: false }), false);
  expectToEqual(get(fixture, 'foo.bar.baz', { default: null }), null);
  expectDeepStrictEqual(get(fixture, 'foo.bar.baz', { default: { one: 'two' } }), { one: 'two' });
});

test('should support nested keys with dots when the whole path is an own key', () => {
  // The walk grows the candidate until it matches the whole-path own key; no shortcut needed.
  expectToStrictEqual(get({ 'a.b.c': 'd' }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b.c.d': 'e' }, 'a.b.c.d'), 'e');
  expectToStrictEqual(get({ 'a.b.c.d': 'e' }, 'a.b.c'), undefined);
  expectToStrictEqual(get({ 'a.b.c.d.e.f': 'g' }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { b: { c: 'd' } } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ a: { b: { c: { d: { e: { f: 'g' } } } } } }, 'a.b.c.d.e.f'), 'g');

  expectDeepStrictEqual(get({ 'a.b.c.d.e': { f: 'g' } }, 'a.b.c.d.e'), {
    f: 'g',
  });
  expectDeepStrictEqual(get({ 'a.b.c.d': { 'e.f': 'g' } }, 'a.b.c.d.e'), undefined);
  expectDeepStrictEqual(get({ 'a.b.c': { 'd.e.f': 'g' } }, 'a.b.c'), {
    'd.e.f': 'g',
  });
  expectDeepStrictEqual(get({ 'a.b': { 'c.d.e.f': 'g' } }, 'a.b'), {
    'c.d.e.f': 'g',
  });
  expectDeepStrictEqual(get({ a: { 'b.c.d.e.f': 'g' } }, 'a'), {
    'b.c.d.e.f': 'g',
  });
});

test('should support nested keys with dots when the literal dots are escaped', () => {
  // A literal dot in a key must be escaped. However the dots are distributed
  // between literal keys and nesting, the escaped path reaches the value.
  expectToStrictEqual(get({ 'a.b': { c: 'd' } }, 'a\\.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b': { c: { d: 'e' } } }, 'a\\.b.c.d'), 'e');
  expectToStrictEqual(get({ a: { 'b.c': 'd' } }, 'a.b\\.c'), 'd');

  expectToStrictEqual(get({ 'a.b.c.d.e': { f: 'g' } }, 'a\\.b\\.c\\.d\\.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c.d': { e: { f: 'g' } } }, 'a\\.b\\.c\\.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c': { d: { e: { f: 'g' } } } }, 'a\\.b\\.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { c: { d: { e: { f: 'g' } } } } }, 'a\\.b.c.d.e.f'), 'g');

  expectToStrictEqual(get({ 'a.b.c.d': { 'e.f': 'g' } }, 'a\\.b\\.c\\.d.e\\.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c': { 'd.e.f': 'g' } }, 'a\\.b\\.c.d\\.e\\.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { 'c.d.e.f': 'g' } }, 'a\\.b.c\\.d\\.e\\.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d.e.f': 'g' } }, 'a.b\\.c\\.d\\.e\\.f'), 'g');

  expectToStrictEqual(get({ 'a.b': { 'c.d': { 'e.f': 'g' } } }, 'a\\.b.c\\.d.e\\.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { c: { 'd.e.f': 'g' } } }, 'a\\.b.c.d\\.e\\.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d.e': { f: 'g' } } }, 'a.b\\.c\\.d\\.e.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d': { 'e.f': 'g' } } }, 'a.b\\.c\\.d.e\\.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c': { 'd.e.f': 'g' } } }, 'a.b\\.c.d\\.e\\.f'), 'g');
  expectToStrictEqual(get({ a: { b: { 'c.d.e.f': 'g' } } }, 'a.b.c\\.d\\.e\\.f'), 'g');
});

test('should resolve an unescaped path against a literal dotted key at any depth', () => {
  // At each level the strict segment wins if it is present; on a miss the segment is joined
  // with successive following segments and the shortest joined key present on the target is
  // used, so a literal dotted key is reachable without escaping.
  expectToStrictEqual(get({ 'a.b': { c: 'd' } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ a: { 'b.c': 'd' } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b': { c: { d: 'e' } } }, 'a.b.c.d'), 'e');
  expectToStrictEqual(get({ 'a.b.c.d.e': { f: 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { b: { 'c.d.e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { c: 'd' } }, 'a.b.c', 'fallback'), 'd');
});

test('should get a value from an array', () => {
  const fixture = {
    a: { paths: ['a.txt', 'a.js', 'a.hbs'] },
    b: {
      paths: {
        0: 'b.txt',
        1: 'b.js',
        2: 'b.hbs',
        3: 'b3.hbs',
      },
    },
  };
  expectToStrictEqual(get(fixture, 'a.paths.0'), 'a.txt');
  expectToStrictEqual(get(fixture, 'a.paths.1'), 'a.js');
  expectToStrictEqual(get(fixture, 'a.paths.2'), 'a.hbs');

  expectToStrictEqual(get(fixture, 'b.paths.0'), 'b.txt');
  expectToStrictEqual(get(fixture, 'b.paths.1'), 'b.js');
  expectToStrictEqual(get(fixture, 'b.paths.2'), 'b.hbs');
  expectToStrictEqual(get(fixture, 'b.paths.3'), 'b3.hbs');
});

test('should get a value from an object in an array', () => {
  expectToStrictEqual(get({ a: { b: [{ c: 'd' }] } }, 'a.b.0.c'), 'd');
  expectToStrictEqual(get({ a: { b: [{ c: 'd' }, { e: 'f' }] } }, 'a.b.1.e'), 'f');
  expectToStrictEqual(get({ a: { b: [{ c: 'd' }] } }, 'a.b.0.c'), 'd');
  expectToStrictEqual(get({ a: { b: [{ c: 'd' }, { e: 'f' }] } }, 'a.b.1.e'), 'f');
});

test('should return `undefined` if the path is not found', () => {
  const fixture = { a: { b: {} } };
  expectToStrictEqual(get(fixture, 'a.b.c'), undefined);
  expectToStrictEqual(get(fixture, 'a.b.c.d'), undefined);
});

test('should get the specified property', () => {
  expectDeepStrictEqual(get({ a: 'aaa', b: 'b' }, 'a'), 'aaa');
  expectDeepStrictEqual(get({ first: 'Jon', last: 'Schlinkert' }, 'first'), 'Jon');
  expectDeepStrictEqual(get({ locals: { a: 'a' }, options: { b: 'b' } }, 'locals'), { a: 'a' });
});

test('should return the default value when the path is an array', () => {
  // Array paths are no longer supported - only strings (and numbers, which are coerced).
  expectDeepStrictEqual(get({ a: 'aaa', b: 'b' }, ['a']), undefined);
  expectDeepStrictEqual(get({ a: { b: { c: 'd' } } }, ['a', 'b', 'c'], 'fallback'), 'fallback');
  expectDeepStrictEqual(get({ locals: { a: 'a' } }, ['locals'], null), null);
});

test('should support escaped dots', () => {
  expectDeepStrictEqual(get({ 'a.b': 'a', b: { c: 'd' } }, 'a\\.b'), 'a');
  expectDeepStrictEqual(get({ 'a.b': { b: { c: 'd' } } }, 'a\\.b.b.c'), 'd');
});

test('should get the value of a deeply nested property', () => {
  expectToStrictEqual(get({ a: { b: 'c', c: { d: 'e', e: 'f', g: { h: 'i' } } } }, 'a.c.g.h'), 'i');
});

/**
 * These tests are from the "dot-prop" library
 */

describe('dot-prop tests:', () => {
  test('should pass dot-prop tests', () => {
    const f1 = { foo: { bar: 1 } };
    f1[''] = 'foo';
    expectDeepStrictEqual(get(f1, ''), 'foo');
    expectDeepStrictEqual(get(f1, 'foo'), f1.foo);
    expectDeepStrictEqual(get({ foo: 1 }, 'foo'), 1);
    expectDeepStrictEqual(get({ foo: null }, 'foo'), null);
    expectDeepStrictEqual(get({ foo: undefined }, 'foo'), undefined);
    expectDeepStrictEqual(get({ foo: { bar: true } }, 'foo.bar'), true);
    expectDeepStrictEqual(get({ foo: { bar: { baz: true } } }, 'foo.bar.baz'), true);
    expectDeepStrictEqual(get({ foo: { bar: { baz: null } } }, 'foo.bar.baz'), null);
    expectDeepStrictEqual(get({ '\\': true }, '\\'), true);
    expectDeepStrictEqual(get({ '\\foo': true }, '\\foo'), true);
    expectDeepStrictEqual(get({ 'bar\\': true }, 'bar\\'), true);
    expectDeepStrictEqual(get({ 'foo\\bar': true }, 'foo\\bar'), true);
    expectDeepStrictEqual(get({ '\\.foo': true }, '\\\\.foo'), true);
    expectDeepStrictEqual(get({ 'bar\\.': true }, 'bar\\\\.'), true);
    expectDeepStrictEqual(get({ 'foo\\.bar': true }, 'foo\\\\.bar'), true);
    expectDeepStrictEqual(get({ foo: 1 }, 'foo.bar'), undefined);

    // dot-prop reads through a function target; Lowdefy does not - only data structures are
    // traversable, so a function as the root target yields the default.
    function fn() {}
    fn.foo = { bar: 1 };
    expectDeepStrictEqual(get(fn, 'foo'), undefined);
    expectDeepStrictEqual(get(fn, 'foo.bar'), undefined);

    const f3 = { foo: null };
    expectDeepStrictEqual(get(f3, 'foo.bar'), undefined);
    expectDeepStrictEqual(get(f3, 'foo.bar', { default: 'some value' }), 'some value');

    expectDeepStrictEqual(get({ 'foo.baz': { bar: true } }, 'foo\\.baz.bar'), true);
    expectDeepStrictEqual(get({ 'fo.ob.az': { bar: true } }, 'fo\\.ob\\.az.bar'), true);

    expectDeepStrictEqual(get(null, 'foo.bar', { default: false }), false);
    expectDeepStrictEqual(get('foo', 'foo.bar', { default: false }), false);
    expectDeepStrictEqual(get([], 'foo.bar', { default: false }), false);
    expectDeepStrictEqual(get(undefined, 'foo.bar', { default: false }), false);
  });

  test('should return a default value', () => {
    expectDeepStrictEqual(get({ foo: { bar: 'a' } }, 'foo.fake'), undefined);
    expectDeepStrictEqual(get({ foo: { bar: 'a' } }, 'foo.fake.fake2'), undefined);
    expectDeepStrictEqual(get({ foo: { bar: 'a' } }, 'foo.fake.fake2', 'some value'), 'some value');
  });

  test('should pass all of the dot-prop tests', () => {
    const f1 = { foo: { bar: 1 } };
    expectDeepStrictEqual(get(f1), undefined);
    expectDeepStrictEqual(get(f1, 'foo'), f1.foo);
    expectDeepStrictEqual(get({ foo: 1 }, 'foo'), 1);
    expectDeepStrictEqual(get({ foo: null }, 'foo'), null);
    expectDeepStrictEqual(get({ foo: undefined }, 'foo'), undefined);
    expectDeepStrictEqual(get({ foo: { bar: true } }, 'foo.bar'), true);
    expectDeepStrictEqual(get({ foo: { bar: { baz: true } } }, 'foo.bar.baz'), true);
    expectDeepStrictEqual(get({ foo: { bar: { baz: null } } }, 'foo.bar.baz'), null);
    expectDeepStrictEqual(get({ foo: { bar: 'a' } }, 'foo.fake.fake2'), undefined);
  });
});

/**
 * These tests are from the "object-path" library
 */

describe('object-path .get tests', () => {
  function getTestObj() {
    return {
      a: 'b',
      b: {
        c: [],
        d: ['a', 'b'],
        e: [{}, { f: 'g' }],
        f: 'i',
      },
    };
  }

  test('should return the value using unicode key', () => {
    const obj = { '15\u00f8C': { '3\u0111': 1 } };
    expectToEqual(get(obj, '15\u00f8C.3\u0111'), 1);
  });

  test('should return the value of an empty array', () => {
    const obj = { a: { b: [] } };
    expectToEqual(get(obj, 'a.b'), []);
  });

  // The escaped form is the explicit way to address a literal dotted key; the unescaped path
  // reaches the same value through the rejoin.
  test('should return the value using dot in key', () => {
    const obj = { 'a.b': { 'looks.like': 1 } };
    expectToEqual(get(obj, 'a\\.b.looks\\.like'), 1);
    expectToEqual(get(obj, 'a.b.looks.like'), 1);
  });

  test('should return the value under shallow object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'a'), 'b');
  });

  test('should work with number path', () => {
    const obj = getTestObj();
    expectToEqual(get(obj.b.d, 0), 'a');
    expectToEqual(get(obj.b, 0), undefined);
  });

  test('should return the value under deep object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.f'), 'i');
  });

  test('should return the value under array', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.d.0'), 'a');
  });

  test('should return the value under array deep', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.e.1.f'), 'g');
  });

  test('should return undefined for missing values under object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'a.b'), undefined);
  });

  test('should return undefined for missing values under array', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.d.5'), undefined);
  });

  test('should return the value under integer-like key', () => {
    const obj = { '1a': 'foo' };
    expectToEqual(get(obj, '1a'), 'foo');
  });

  test('should return the default value when the key doesnt exist', () => {
    const obj = { '1a': 'foo' };
    expectToEqual(get(obj, '1b', null), null);
  });

  // this test differs from behavior in object-path. I was unable to figure
  // out exactly how the default values work in object-path.
  test('should return the default value when path is empty', () => {
    const obj = { '1a': 'foo' };
    expectDeepStrictEqual(get(obj, '', null), null);
  });

  test('should return the default value when object is null or undefined', () => {
    expectDeepStrictEqual(get(null, 'test', { default: 'a' }), 'a');
    expectDeepStrictEqual(get(undefined, 'test', { default: 'a' }), 'a');
  });

  test('should not fail on an object with a null prototype', () => {
    const foo = 'FOO';
    const objWithNullProto = Object.create(null);
    objWithNullProto.foo = foo;
    expectToEqual(get(objWithNullProto, 'foo'), foo);
  });

  // object-path does not allow the user to read non-own properties, and neither does this
  // helper: a lookup is own-only, so an inherited member is never returned as a value.
  test('should return the default for non-"own" properties', () => {
    const Base = function () {};
    Base.prototype = {
      one: {
        two: true,
      },
    };
    const Extended = function () {
      Base.call(this, true);
    };
    Extended.prototype = Object.create(Base.prototype);

    const extended = new Extended();

    expectToEqual(get(extended, 'one.two'), undefined);
    extended.enabled = true;

    expectToEqual(get(extended, 'enabled'), true);
    expectDeepStrictEqual(get(extended, 'one'), undefined);
  });
});

describe('deep-property unit tests', () => {
  test('should handle invalid input', () => {
    const a = undefined;
    const b = {};

    expectToEqual(get(a, 'sample'), undefined);
    expectDeepStrictEqual(get(b, undefined), undefined);
    expectDeepStrictEqual(get(b, ''), undefined);
    expectDeepStrictEqual(get(b, '...'), undefined);
  });

  test('should get shallow properties', () => {
    const fn = function () {};
    const a = {
      sample: 'string',
      example: fn,
      unknown: undefined,
    };

    expectToEqual(get(a, 'example'), fn);
    expectToEqual(get(a, 'sample'), 'string');
    expectToEqual(get(a, 'unknown'), undefined);
    expectToEqual(get(a, 'invalid'), undefined);
  });

  test('should get deep properties', () => {
    const a = {
      b: { example: { type: 'vegetable' } },
      c: { example: { type: 'mineral' } },
    };

    expectToEqual(get(a, 'b.example.type'), 'vegetable');
    expectToEqual(get(a, 'c.example.type'), 'mineral');
    expectToEqual(get(a, 'c.gorky.type'), undefined);
  });
});

test('get should not copy objects', () => {
  const veg = { type: 'vegetable' };
  const min = { type: 'mineral' };
  const a = {
    b: { example: veg },
    c: { example: min },
  };
  expect(get(a, 'b.example')).toBe(veg);
  expect(get(a, 'c.example')).toBe(min);
});

test('get should copy objects with copy option true', () => {
  const veg = { type: 'vegetable' };
  const min = { type: 'mineral' };
  const a = {
    b: { example: veg },
    c: { example: min },
  };
  expect(get(a, 'b.example', { copy: true })).not.toBe(veg);
  expect(get(a, 'b.example', { copy: true })).toEqual(veg);
  expect(get(a, 'c.example', { copy: true })).not.toBe(min);
  expect(get(a, 'c.example', { copy: true })).toEqual(min);
});

describe('reserved key guard', () => {
  test('get throws ReservedKeyError even when the reserved key is an own property', () => {
    expect(() => get({ constructor: 1 }, 'constructor')).toThrow(ReservedKeyError);
    expect(() => get({ prototype: 1 }, 'prototype')).toThrow('Reserved key "prototype"');
    const nullProto = Object.create(null);
    nullProto.__proto__ = 'own value';
    expect(() => get(nullProto, '__proto__')).toThrow(ReservedKeyError);
    expect(() => get({ a: { constructor: 1 } }, 'a.constructor')).toThrow(ReservedKeyError);
  });

  test('get throws ReservedKeyError when the path is a reserved key', () => {
    expect(() => get({}, '__proto__')).toThrow(ReservedKeyError);
    expect(() => get({}, '__proto__')).toThrow('Reserved key "__proto__"');
  });

  test('get throws ReservedKeyError carrying the offending segment', () => {
    expect.assertions(2);
    try {
      get({}, 'a.__proto__.b');
    } catch (error) {
      expect(error).toBeInstanceOf(ReservedKeyError);
      expect(error.segment).toEqual('__proto__');
    }
  });

  test('get throws on the first reserved segment of the path', () => {
    expect.assertions(1);
    try {
      get({}, 'constructor.prototype');
    } catch (error) {
      expect(error.segment).toEqual('constructor');
    }
  });

  test('get throws ReservedKeyError for accessor-installing Object.prototype methods', () => {
    expect(() => get({}, '__defineGetter__')).toThrow(ReservedKeyError);
    expect(() => get({}, '__defineSetter__')).toThrow(ReservedKeyError);
    expect(() => get({}, '__lookupGetter__')).toThrow(ReservedKeyError);
    expect(() => get({}, '__lookupSetter__')).toThrow(ReservedKeyError);
  });

  test('get throws ReservedKeyError even when a default is given', () => {
    // A reserved key is illegal input, not a missing path, so the
    // default-on-missing contract does not apply.
    expect(() => get({ a: 1 }, '__proto__', { default: 'fallback' })).toThrow(ReservedKeyError);
    expect(() => get({ a: 1 }, '__proto__', 'fallback')).toThrow(ReservedKeyError);
  });

  test('get does not treat a dotted literal key as reserved', () => {
    // A re-joined key always contains a dot; no reserved key does.
    expect(get({ '__pro.to__': 1 }, '__pro.to__')).toEqual(1);
  });

  test('get scans every segment for reserved keys regardless of descent depth', () => {
    // The walk would stop at the missing "a", but the guard still fires.
    expect(() => get({}, 'a.b.c.prototype')).toThrow(ReservedKeyError);
  });

  test('get returns the default for non-reserved Object.prototype member names', () => {
    // Lookups are own-only, so a built-in prototype member is never returned as a value -
    // the reserved list is about illegal input, not about hiding inherited members.
    expect(get({}, 'hasOwnProperty')).toEqual(undefined);
    expect(get({}, 'toString')).toEqual(undefined);
  });
});

describe('own-property lookup', () => {
  class Instance {
    constructor() {
      this.own = 'ownValue';
    }

    foo() {
      return 'bar';
    }
  }

  test('get returns the default for an inherited Object.prototype member', () => {
    expect(get({}, 'toString')).toEqual(undefined);
    expect(get({}, 'valueOf')).toEqual(undefined);
    expect(get({}, 'hasOwnProperty')).toEqual(undefined);
    expect(get({}, 'propertyIsEnumerable')).toEqual(undefined);
  });

  test('get returns the default for an inherited Array.prototype member but reads length', () => {
    expect(get([1], 'map')).toEqual(undefined);
    expect(get([1], 'length')).toEqual(1);
  });

  test('get does not throw on an inherited member under copy', () => {
    // A built-in method used to be returned here, and serializer.copy turned it into
    // `JSON.parse(undefined)`. Own-only lookup removes the path to it.
    expect(() => get({}, 'toString', { copy: true })).not.toThrow();
    expect(get({}, 'toString', { copy: true })).toEqual(undefined);
  });

  test('get returns the default for a class instance method on its prototype', () => {
    expect(get(new Instance(), 'foo')).toEqual(undefined);
    expect(get({ i: new Instance() }, 'i.foo')).toEqual(undefined);
  });

  test('get reads an own property off a class instance', () => {
    expect(get({ i: new Instance() }, 'i.own')).toEqual('ownValue');
  });
});

describe('descent predicate', () => {
  test('get does not descend into a function', () => {
    expect(get({ fn: () => 1 }, 'fn.name')).toEqual(undefined);
    expect(get({ fn: () => 1 }, 'fn.call')).toEqual(undefined);
  });

  test('get returns the default when the root target is a function', () => {
    expect(get(function () {}, 'a.b')).toEqual(undefined);
  });

  test('get does not descend into a Date, URL or Map', () => {
    expect(get({ d: new Date(0) }, 'd.getTime')).toEqual(undefined);
    expect(get({ u: new URL('https://example.com/p') }, 'u.pathname')).toEqual(undefined);
    expect(get({ m: new Map([['a', 1]]) }, 'm.size')).toEqual(undefined);
  });

  test('get descends into arrays', () => {
    expect(get({ a: [{ b: 1 }] }, 'a.0.b')).toEqual(1);
  });

  test('get descends into a class instance', () => {
    // type.isObject cannot exclude class instances - kindOf maps every `[object Object]` tag to
    // 'object' - so an instance's own properties are reachable. Pinned as the predicate's actual
    // shape, not as a desired one; narrowing it is tracked separately.
    class Instance {
      constructor() {
        this.own = 'ownValue';
      }
    }
    expect(get({ i: new Instance() }, 'i.own')).toEqual('ownValue');
  });

  test('get returns a live object as-is when it is the endpoint of the path', () => {
    // The predicate is never consulted for an endpoint value, so it cannot prevent a live
    // object's internals being returned, or serialized under copy.
    class Instance {
      constructor() {
        this.internal = 'secret';
      }
    }
    const instance = new Instance();
    expect(get({ i: instance }, 'i')).toBe(instance);
    expect(get({ i: instance }, 'i', { copy: true })).toEqual({ internal: 'secret' });
  });

  test('get does not descend into null, undefined or primitives', () => {
    expect(get({ a: null }, 'a.b', 'fallback')).toEqual('fallback');
    expect(get({ a: undefined }, 'a.b', 'fallback')).toEqual('fallback');
    expect(get({ a: 'str' }, 'a.length', 'fallback')).toEqual('fallback');
    expect(get({ a: 1 }, 'a.toFixed', 'fallback')).toEqual('fallback');
  });
});

describe('lookups on errors', () => {
  test('get reads message and name off an Error target', () => {
    const error = new Error('boom');
    expect(get(error, 'message')).toEqual('boom');
    expect(get(error, 'name')).toEqual('Error');
  });

  test('get reads a property one level inside an Error', () => {
    expect(get({ e: new Error('boom') }, 'e.message')).toEqual('boom');
  });

  test('get descends through nested Error causes', () => {
    const error = new Error('x', { cause: new Error('y') });
    expect(get(error, 'cause.message')).toEqual('y');
    expect(get({ error }, 'error.cause.message')).toEqual('y');
  });

  test('get descends into a plain-object cause', () => {
    expect(get(new Error('x', { cause: { code: 'BAD' } }), 'cause.code')).toEqual('BAD');
  });

  test('get returns the default for a missing key inside an Error', () => {
    expect(get({ e: new Error('x') }, 'e.code', 'fallback')).toEqual('fallback');
  });

  test('get returns the default for an inherited member of an Error', () => {
    // The extracted props are a plain object, so own-only lookup applies to them too.
    expect(get({ e: new Error('x') }, 'e.toString')).toEqual(undefined);
  });

  test('get returns an Error unchanged when the error is the endpoint of the path', () => {
    // No lookup happens on the error, so no conversion happens either.
    const error = new Error('boom');
    expect(get({ e: error }, 'e')).toBeInstanceOf(Error);
    expect(get({ a: { e: error } }, 'a.e')).toBeInstanceOf(Error);
  });

  test('get returns a class instance held on an Error as a marker', () => {
    class FakeSocket {}
    const error = new Error('boom');
    error.socket = new FakeSocket();
    expect(get({ e: error }, 'e.socket')).toEqual('[Object: FakeSocket]');
  });

  test('get resolves a cause chain to depth 3 and returns the default past it', () => {
    // extractErrorProps has MAX_CAUSE_DEPTH = 3, so the fourth cause is the string '[Truncated]'
    // and a lookup on it defaults. Lowdefy wraps errors several layers deep, so this is reachable.
    let error = new Error('l4');
    for (const message of ['l3', 'l2', 'l1', 'l0']) {
      error = new Error(message, { cause: error });
    }
    expect(get(error, 'cause.message')).toEqual('l1');
    expect(get(error, 'cause.cause.cause.message')).toEqual('l3');
    expect(get(error, 'cause.cause.cause.cause')).toEqual('[Truncated]');
    expect(get(error, 'cause.cause.cause.cause.message')).toEqual(undefined);
  });

  test('get truncates a deep object held on an error at object depth 5', () => {
    // extractErrorProps has MAX_OBJECT_DEPTH = 5. A missed path returns a recognisable default,
    // but the whole subtree arrives with '[Truncated]' baked in as a string literal.
    const error = new Error('boom');
    error.data = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };
    expect(get(error, 'data.a.b.c.d.e.f')).toEqual(undefined);
    expect(get(error, 'data')).toEqual({ a: { b: { c: { d: { e: '[Truncated]' } } } } });
  });

  test('get returns a nested cause as extracted props rather than an Error instance', () => {
    const error = new Error('x', { cause: new Error('y') });
    expect(get(error, 'cause')).not.toBeInstanceOf(Error);
    expect(get(error, 'cause').message).toEqual('y');
  });

  test('get returns the default for a non-enumerable own property on an error', () => {
    // extractErrorProps enumerates with Object.keys, so a non-enumerable own property never makes
    // it into the plain-data form get reads. AggregateError's own `errors` array is the built-in
    // an app author is most likely to actually meet.
    const aggregate = new AggregateError([new Error('a')], 'agg');
    expect(get(aggregate, 'errors.0.message')).toEqual(undefined);

    class WithHiddenProp extends Error {
      constructor() {
        super('boom');
        Object.defineProperty(this, 'secret', { value: 'hidden', enumerable: false });
      }
    }
    expect(get(new WithHiddenProp(), 'secret')).toEqual(undefined);
  });

  test('get returns the default for a getter on an Error subclass', () => {
    // Object.keys does not report accessors either, so a computed property is lost the same way a
    // non-enumerable one is.
    class WithGetter extends Error {
      get computed() {
        return 'derived';
      }
    }
    expect(get(new WithGetter(), 'computed')).toEqual(undefined);
  });

  test('get reads Node fs error fields unaffected by the enumerable-own limit', () => {
    // errno/code/syscall/path are set as ordinary enumerable own properties, so this loss does not
    // reach Node's own ENOENT-style errors.
    const error = new Error('ENOENT: no such file');
    error.errno = -2;
    error.code = 'ENOENT';
    error.syscall = 'open';
    error.path = '/tmp/x';
    expect(get(error, 'code')).toEqual('ENOENT');
    expect(get(error, 'errno')).toEqual(-2);
    expect(get(error, 'syscall')).toEqual('open');
    expect(get(error, 'path')).toEqual('/tmp/x');
  });
});

describe('dotted key resolution', () => {
  test('get resolves an escaped dot as a literal key character', () => {
    expect(get({ a: { 'b.c': 1 } }, 'a.b\\.c')).toEqual(1);
    expect(get({ 'a.b': { c: 1 } }, 'a\\.b.c')).toEqual(1);
  });

  test('get resolves an unescaped path against a nested literal dotted key', () => {
    expect(get({ attributes: { 'a.b': 'v' } }, 'attributes.a.b')).toEqual('v');
    expect(get({ profile: { 'https://ex.com/c': 'v' } }, 'profile.https://ex.com/c')).toEqual('v');
    expect(get({ 'a.b': { c: 1 } }, 'a.b.c')).toEqual(1);
    expect(get({ a: { 'b.c': 1 } }, 'a.b.c')).toEqual(1);
  });

  test('get prefers the strict segment over a literal dotted key when both are present', () => {
    expect(get({ a: { b: { c: 'nested' } }, 'a.b': { c: 'literal' } }, 'a.b.c')).toEqual('nested');
  });

  test('get matches joined candidates shortest-first', () => {
    expect(get({ 'a.b': { c: { d: 1 } }, 'a.b.c': { d: 2 } }, 'a.b.c.d')).toEqual(1);
  });

  test('get does not backtrack to a longer joined key after a match', () => {
    // 'a.b' is taken, 'c' is missing inside it, and 'a.b.c' is never retried.
    expect(get({ 'a.b': {}, 'a.b.c': { d: 1 } }, 'a.b.c.d')).toEqual(undefined);
    expect(get({ 'a.b': {}, 'a.b.c': { d: 1 } }, 'a.b.c.d', 'fallback')).toEqual('fallback');
  });

  test('get takes the shorter joined key over a whole-path own key and does not backtrack', () => {
    // Shortest-first applies at the root too: 'a.b' is taken, 'c' is missing inside it, and the
    // whole-path key 'a.b.c' is never retried. There is no whole-path shortcut ahead of the walk,
    // which is what keeps set/get/unset resolving the same key.
    expect(get({ 'a.b': {}, 'a.b.c': 1 }, 'a.b.c')).toEqual(undefined);
    expect(get({ 'a.b': {}, 'a.b.c': 1 }, 'a.b.c', 'fallback')).toEqual('fallback');
  });

  test('get lets a strict segment holding a non-traversable value shadow a literal dotted sibling', () => {
    // 'email' is present, so the strict segment wins even though its value ('x') cannot be walked
    // into; the literal key 'email.verified' is never reached. This is the larger of the two shadow
    // classes the removed whole-path fast path used to paper over, and the likelier real-world
    // shape - an OIDC claim set or API response carrying both 'email' and 'email.verified'.
    expect(get({ email: 'x', 'email.verified': true }, 'email.verified')).toEqual(undefined);
  });

  test('get read/modify/write round-trips through set on a strict-segment shadow', () => {
    // set still resolves 'email' first and autovivifies it into an object to hold 'verified', so
    // the write lands where the read looked, keeping set(o, p, get(o, p)) a fixed point even though
    // the initial read returned undefined rather than the literal sibling's value.
    const obj = { email: 'x', 'email.verified': true };
    set(obj, 'email.verified', 'W');
    expect(obj).toEqual({ email: { verified: 'W' }, 'email.verified': true });
    expect(get(obj, 'email.verified')).toEqual('W');
  });

  test('get resolves a whole-path literal dotted key through the walk when nothing shadows it', () => {
    expect(get({ 'a.b.c': 1 }, 'a.b.c')).toEqual(1);
    expect(get({ 'a.': 1 }, 'a.')).toEqual(1);
    expect(get({ '': 1 }, '')).toEqual(1);
  });

  test('get read/modify/write round-trips through set and unset on an overlapping key', () => {
    // set(o, p, get(o, p)) must be a fixed point: all three helpers resolve 'a.b' then 'c'.
    const obj = { 'a.b': { c: 1 }, 'a.b.c': 99 };
    set(obj, 'a.b.c', get(obj, 'a.b.c') + 1);
    expect(obj).toEqual({ 'a.b': { c: 2 }, 'a.b.c': 99 });
    expect(get(obj, 'a.b.c')).toEqual(2);
    unset(obj, 'a.b.c');
    expect(obj).toEqual({ 'a.b': {}, 'a.b.c': 99 });
    expect(get(obj, 'a.b.c')).toEqual(undefined);
  });

  test('get throws ReservedKeyError for a literal dotted key holding a reserved segment', () => {
    // The reserved pre-scan runs on the split segments before the walk, so 'a.constructor' is
    // rejected as illegal input even though it is an own key. set and unset reject it identically.
    expect(() => get({ 'a.constructor': 1 }, 'a.constructor')).toThrow(ReservedKeyError);
  });

  test('get rejoins an escaped segment into a longer literal dotted key', () => {
    // Escaping fixes what a segment contains, not whether it takes part in a rejoin, so
    // `a.b\.c` joins to the literal key 'a.b.c'. Matches set and unset.
    expect(get({ 'a.b.c': 1 }, 'a.b\\.c')).toEqual(1);
  });

  test('get returns the default when a trailing backslash escapes nothing', () => {
    expect(get({ a: 1 }, 'a.b\\', 'fallback')).toEqual('fallback');
    expect(get({ 'b\\': 1 }, 'b\\')).toEqual(1);
  });

  test('get returns 1 for a simple nested read', () => {
    expect(get({ a: { b: 1 } }, 'a.b')).toEqual(1);
    expect(get({ a: { b: 1 } }, 'a.c', 'default')).toEqual('default');
  });
});
