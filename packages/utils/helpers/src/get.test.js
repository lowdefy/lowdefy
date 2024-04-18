/*
  Copyright 2020-2024 Lowdefy, Inc

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

test('should support a custom separator on options.separator', () => {
  const fixture = { 'a.b': { c: { d: 'e' } } };
  expectToStrictEqual(get(fixture, 'a.b/c/d', { separator: '/' }), 'e');
  expectToStrictEqual(get(fixture, 'a\\.b.c.d', { separator: /\\?\./ }), 'e');
});

test('should support a custom split function', () => {
  const fixture = { 'a.b': { c: { d: 'e' } } };
  expectToStrictEqual(get(fixture, 'a.b/c/d', { split: (path) => path.split('/') }), 'e');
  expectToStrictEqual(get(fixture, 'a\\.b.c.d', { split: (path) => path.split(/\\?\./) }), 'e');
});

test('should support a custom join character', () => {
  const fixture = { 'a-b': { c: { d: 'e' } } };
  const options = { joinChar: '-' };
  expectToStrictEqual(get(fixture, 'a.b.c.d', options), 'e');
});

test('should support a custom join function', () => {
  const fixture = { 'a-b': { c: { d: 'e' } } };
  const options = {
    split: (path) => path.split(/[-/]/),
    join: (segs) => segs.join('-'),
  };
  expectToStrictEqual(get(fixture, 'a/b-c/d', options), 'e');
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

test('should support a custom function for validating the object', () => {
  const isEnumerable = Object.prototype.propertyIsEnumerable;
  const options = {
    isValid(key, obj) {
      return isEnumerable.call(obj, key);
    },
  };

  const fixture = { 'a.b': { c: { d: 'e' } } };
  expectToStrictEqual(get(fixture, 'a.b.c.d', options), 'e');
});

test('should support nested keys with dots', () => {
  expectToStrictEqual(get({ 'a.b.c': 'd' }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b': { c: 'd' } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b': { c: { d: 'e' } } }, 'a.b.c.d'), 'e');
  expectToStrictEqual(get({ a: { b: { c: 'd' } } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ a: { 'b.c': 'd' } }, 'a.b.c'), 'd');
  expectToStrictEqual(get({ 'a.b.c.d': 'e' }, 'a.b.c.d'), 'e');
  expectToStrictEqual(get({ 'a.b.c.d': 'e' }, 'a.b.c'), undefined);

  expectToStrictEqual(get({ 'a.b.c.d.e.f': 'g' }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c.d.e': { f: 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c.d': { e: { f: 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c': { d: { e: { f: 'g' } } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { c: { d: { e: { f: 'g' } } } } }, 'a.b.c.d.e.f'), 'g');
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

  expectToStrictEqual(get({ 'a.b.c.d.e': { f: 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c.d': { 'e.f': 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b.c': { 'd.e.f': 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { 'c.d.e.f': 'g' } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d.e.f': 'g' } }, 'a.b.c.d.e.f'), 'g');

  expectToStrictEqual(get({ 'a.b': { 'c.d': { 'e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ 'a.b': { c: { 'd.e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d.e': { f: 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c.d': { 'e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { 'b.c': { 'd.e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
  expectToStrictEqual(get({ a: { b: { 'c.d.e.f': 'g' } } }, 'a.b.c.d.e.f'), 'g');
});

test('should support return default when options.isValid returns false', () => {
  const fixture = { foo: { bar: { baz: 'qux' }, 'a.b.c': 'xyx', yyy: 'zzz' } };
  const options = (val) => ({
    ...{
      default: val,
      isValid(key) {
        return key !== 'bar' && key !== 'a.b.c';
      },
    },
  });

  expectToEqual(get(fixture, 'foo.bar.baz', options('fez')), 'fez');
  expectToEqual(get(fixture, 'foo.bar.baz', options(true)), true);
  expectToEqual(get(fixture, 'foo.bar.baz', options(false)), false);
  expectToEqual(get(fixture, 'foo.bar.baz', options(null)), null);

  expectToEqual(get(fixture, 'foo.a.b.c', options('fez')), 'fez');
  expectToEqual(get(fixture, 'foo.a.b.c', options(true)), true);
  expectToEqual(get(fixture, 'foo.a.b.c', options(false)), false);
  expectToEqual(get(fixture, 'foo.a.b.c', options(null)), null);

  expectToEqual(get(fixture, 'foo.yyy', options('fez')), 'zzz');
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

test('should support passing a property formatted as an array', () => {
  expectDeepStrictEqual(get({ a: 'aaa', b: 'b' }, ['a']), 'aaa');
  expectDeepStrictEqual(get({ a: { b: { c: 'd' } } }, ['a', 'b', 'c']), 'd');
  expectDeepStrictEqual(get({ first: 'Harry', last: 'Potter' }, ['first']), 'Harry');
  expectDeepStrictEqual(get({ locals: { a: 'a' }, options: { b: 'b' } }, ['locals']), { a: 'a' });
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

    function fn() {}
    fn.foo = { bar: 1 };
    expectDeepStrictEqual(get(fn, 'foo'), fn.foo);
    expectDeepStrictEqual(get(fn, 'foo.bar'), 1);

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

  test('should use a custom options.isValid function', () => {
    const isEnumerable = Object.prototype.propertyIsEnumerable;
    const options = {
      isValid: (key, obj) => isEnumerable.call(obj, key),
    };

    const target = {};
    Object.defineProperty(target, 'foo', {
      value: 'bar',
      enumerable: false,
    });

    expectDeepStrictEqual(get(target, 'foo', options), undefined);
    expectDeepStrictEqual(get({}, 'hasOwnProperty', options), undefined);
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
    expectToEqual(get(obj, ['15\u00f8C', '3\u0111']), 1);
  });

  test('should return the value using dot in key (with array of segments)', () => {
    const obj = { 'a.b': { 'looks.like': 1 } };
    expectToEqual(get(obj, ['a.b', 'looks.like']), 1);
  });

  test('should return the value of an empty array', () => {
    const obj = { a: { b: [] } };
    expectToEqual(get(obj, 'a.b'), []);
  });

  // object-path fails this test
  test('should return the value using dot in key', () => {
    const obj = { 'a.b': { 'looks.like': 1 } };
    expectToEqual(get(obj, 'a.b.looks.like'), 1);
  });

  test('should return the value under shallow object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'a'), 'b');
    expectToEqual(get(obj, ['a']), 'b');
  });

  test('should work with number path', () => {
    const obj = getTestObj();
    expectToEqual(get(obj.b.d, 0), 'a');
    expectToEqual(get(obj.b, 0), undefined);
  });

  test('should return the value under deep object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.f'), 'i');
    expectToEqual(get(obj, ['b', 'f']), 'i');
  });

  test('should return the value under array', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.d.0'), 'a');
    expectToEqual(get(obj, ['b', 'd', 0]), 'a');
  });

  test('should return the value under array deep', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.e.1.f'), 'g');
    expectToEqual(get(obj, ['b', 'e', 1, 'f']), 'g');
  });

  test('should return undefined for missing values under object', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'a.b'), undefined);
    expectToEqual(get(obj, ['a', 'b']), undefined);
  });

  test('should return undefined for missing values under array', () => {
    const obj = getTestObj();
    expectToEqual(get(obj, 'b.d.5'), undefined);
    expectToEqual(get(obj, ['b', 'd', '5']), undefined);
  });

  test('should return the value under integer-like key', () => {
    const obj = { '1a': 'foo' };
    expectToEqual(get(obj, '1a'), 'foo');
    expectToEqual(get(obj, ['1a']), 'foo');
  });

  test('should return the default value when the key doesnt exist', () => {
    const obj = { '1a': 'foo' };
    expectToEqual(get(obj, '1b', null), null);
    expectToEqual(get(obj, ['1b'], null), null);
  });

  // this test differs from behavior in object-path. I was unable to figure
  // out exactly how the default values work in object-path.
  test('should return the default value when path is empty', () => {
    const obj = { '1a': 'foo' };
    expectDeepStrictEqual(get(obj, '', null), null);
    expectDeepStrictEqual(get(obj, []), undefined);
    expectToEqual(get({}, ['1'], 'foo'), 'foo');
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

  // this differs from object-path, which does not allow
  // the user to get non-own properties for some reason.
  test('should get non-"own" properties', () => {
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

    expectToEqual(get(extended, ['one', 'two']), true);
    extended.enabled = true;

    expectToEqual(get(extended, 'enabled'), true);
    expectDeepStrictEqual(get(extended, 'one'), { two: true });
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

  // test('should get properties of Error', () => {
  //   const e = new Error(403);
  //   console.log(e.message);
  //   expect(get(e, 'code')).toBe(403);
  // });

  test('should get properties on non-objects', () => {
    const fn = function () {};

    // the commented out lines are from from the "deep-property" lib,
    // but it's invalid javascript. This is a good example of why it's always
    // better to use "use strict" (and lint your code).

    // const str = 'An example string';
    // const num = 42;

    fn.path = { to: { property: 'string' } };
    // str.path = { to: { property: 'string' } };
    // num.path = { to: { property: 'string' } };

    expectToEqual(get(fn, 'path.to.property'), 'string');
    // expectToEqual(get(str, 'path.to.property'), undefined);
    // expectToEqual(get(num, 'path.to.property'), undefined);
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
