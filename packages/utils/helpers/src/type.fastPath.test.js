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

import vm from 'node:vm';

import { describe, expect, test } from 'vitest';

import type from './type.js';

// kindOf as it was before the plain-object fast path, kept here as the reference the
// fast path must agree with on every input.
const TYPED_ARRAY_RE = /^(Int|Uint|Float)\d+(Clamped)?Array$|^Buffer$/;

function referenceKindOf(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  const t = typeof val;
  if (t !== 'object' && t !== 'function') return t;
  if (Array.isArray(val)) return 'array';
  if (val instanceof Date) return 'date';
  if (val instanceof Error) return 'error';
  if (val instanceof RegExp) return 'regexp';
  if (val instanceof Map) return 'map';
  if (val instanceof Set) return 'set';
  if (val instanceof WeakMap) return 'weakmap';
  if (val instanceof WeakSet) return 'weakset';
  if (val instanceof Promise) return 'promise';
  if (t === 'function') return 'function';
  const ctor = val.constructor;
  const name = typeof ctor === 'function' ? ctor.name : null;
  if (name && TYPED_ARRAY_RE.test(name)) return name.toLowerCase();
  if (Object.prototype.toString.call(val) === '[object Object]') return 'object';
  return name ? name.toLowerCase() : 'object';
}

function nullProto(props = {}) {
  return Object.assign(Object.create(null), props);
}

class Plain {}
class Tagged {
  get [Symbol.toStringTag]() {
    return 'Tagged';
  }
}
function Legacy() {}

const realm = vm.createContext({});
const inRealm = (source) => vm.runInContext(source, realm);

const cases = {
  'an empty object': {},
  'an object with keys': { a: 1, b: { c: [1] } },
  'Object.create(null)': Object.create(null),
  'Object.create(null) with keys': nullProto({ a: 1 }),
  'Object.create(null) with a Symbol.toStringTag': nullProto({ [Symbol.toStringTag]: 'Foo' }),
  'Object.create(null) with a constructor function': nullProto({ constructor: Plain }),
  'Object.create(null) with a typed array constructor': nullProto({ constructor: Uint8Array }),
  'Object.create(null) with a constructor string': nullProto({ constructor: 'x' }),
  'an object with a Symbol.toStringTag': { [Symbol.toStringTag]: 'Foo' },
  'an object with a non-string Symbol.toStringTag': { [Symbol.toStringTag]: 7 },
  'an object with a constructor string': { constructor: 'x' },
  'an object with constructor undefined': { constructor: undefined },
  'an object with constructor null': { constructor: null },
  'an object with a constructor function': { constructor: Plain },
  'an object with a constructor function and a Symbol.toStringTag': {
    constructor: Plain,
    [Symbol.toStringTag]: 'Foo',
  },
  'an object with a typed array constructor': { constructor: Uint8Array },
  'an object with a Buffer constructor': { constructor: Buffer },
  'an object with a Date constructor': { constructor: Date },
  'an object with a constructor getter': {
    get constructor() {
      return Plain;
    },
  },
  'an object made by Object.create(Object.prototype)': Object.create(Object.prototype),
  'a class instance': new Plain(),
  'a class instance with a Symbol.toStringTag': new Tagged(),
  'an instance of a function constructor': new Legacy(),
  'an object whose prototype is a plain object': Object.create({ a: 1 }),
  'an object whose prototype is a null-prototype object': Object.create(Object.create(null)),
  'a Date': new Date(0),
  'an invalid Date': new Date('nope'),
  'a Date with a null prototype': Object.setPrototypeOf(new Date(0), null),
  'a Date with Object.prototype': Object.setPrototypeOf(new Date(0), Object.prototype),
  'an Error': new Error('e'),
  'a TypeError': new TypeError('e'),
  'an Error with a null prototype': Object.setPrototypeOf(new Error('e'), null),
  'an Error with Object.prototype': Object.setPrototypeOf(new Error('e'), Object.prototype),
  'an array': [1, 2],
  'an empty array': [],
  'an array with a null prototype': Object.setPrototypeOf([], null),
  'an array with Object.prototype': Object.setPrototypeOf([1], Object.prototype),
  'a RegExp': /a/,
  'a Map': new Map(),
  'a Set': new Set(),
  'a WeakMap': new WeakMap(),
  'a WeakSet': new WeakSet(),
  'a Promise': Promise.resolve(),
  'a Uint8Array': new Uint8Array(2),
  'a Float64Array': new Float64Array(2),
  'a Uint8ClampedArray': new Uint8ClampedArray(2),
  'a Buffer': Buffer.from('a'),
  'an ArrayBuffer': new ArrayBuffer(2),
  'a DataView': new DataView(new ArrayBuffer(2)),
  'a URL': new URL('https://example.com'),
  URLSearchParams: new URLSearchParams('a=1'),
  'a boxed number': Object(1),
  'a boxed string': Object('a'),
  'a boxed boolean': Object(true),
  'a boxed symbol': Object(Symbol('s')),
  'a boxed bigint': Object(1n),
  'an arguments object': (function () {
    return arguments;
  })(1),
  Math: Math,
  JSON: JSON,
  globalThis: globalThis,
  'a Proxy of an object': new Proxy({ a: 1 }, {}),
  'a Proxy of an array': new Proxy([1], {}),
  'a Proxy of a Date': new Proxy(new Date(0), {}),
  'a Proxy of a Date reporting Object.prototype': new Proxy(new Date(0), {
    getPrototypeOf: () => Object.prototype,
  }),
  'a Proxy of an object reporting a null prototype': new Proxy(
    { constructor: Uint8Array },
    { getPrototypeOf: () => null }
  ),
  'a function': () => {},
  'a class': Plain,
  'a function with a null prototype': Object.setPrototypeOf(function () {}, null),
  'an async function': async () => {},
  'a generator object': (function* () {})(),
  'another realm: an object': inRealm('({ a: 1 })'),
  'another realm: Object.create(null)': inRealm('Object.create(null)'),
  'another realm: an array': inRealm('[1]'),
  'another realm: a Date': inRealm('new Date(0)'),
  'another realm: an Error': inRealm('new Error("e")'),
  'another realm: a RegExp': inRealm('/a/'),
  'another realm: a Map': inRealm('new Map()'),
  'another realm: a class instance': inRealm('new (class Foo {})()'),
  'another realm: a tagged object': inRealm('({ [Symbol.toStringTag]: "Foo" })'),
  'another realm: a Uint8Array': inRealm('new Uint8Array(1)'),
  'another realm: a function': inRealm('(function () {})'),
  'a string': 'a',
  'a number': 1,
  NaN: NaN,
  'a boolean': false,
  'a symbol': Symbol('s'),
  'a bigint': 1n,
  null: null,
  undefined: undefined,
};

describe('kindOf fast path gives the full path answer', () => {
  test.each(Object.entries(cases))('%s', (_, value) => {
    const expected = referenceKindOf(value);
    expect(type.typeOf(value)).toBe(expected);
    expect(type.isObject(value)).toBe(expected === 'object');
    expect(type.isEmptyObject(value)).toBe(
      expected === 'object' && Object.keys(value).length === 0
    );
  });
});

describe('kindOf fast path answers', () => {
  test('plain and null-prototype objects are objects', () => {
    expect(type.isObject({})).toBe(true);
    expect(type.isObject(Object.create(null))).toBe(true);
    expect(type.isObject(nullProto({ [Symbol.toStringTag]: 'Foo' }))).toBe(true);
    expect(type.isObject(inRealm('({})'))).toBe(true);
  });

  test('a plain object with a typed array constructor keeps the full path answer', () => {
    expect(type.typeOf({ constructor: Uint8Array })).toBe('uint8array');
    expect(type.typeOf(nullProto({ constructor: Buffer }))).toBe('buffer');
  });

  test('a plain object with a class constructor and a tag keeps the full path answer', () => {
    expect(type.typeOf({ constructor: Plain, [Symbol.toStringTag]: 'Foo' })).toBe('plain');
    expect(type.isObject({ constructor: Plain, [Symbol.toStringTag]: 'Foo' })).toBe(false);
  });

  test('a class instance is an object unless it carries a Symbol.toStringTag', () => {
    expect(type.isObject(new Plain())).toBe(true);
    expect(type.isObject(new Tagged())).toBe(false);
    expect(type.typeOf(new Tagged())).toBe('tagged');
  });

  test('dates, errors and arrays are not objects', () => {
    expect(type.isObject(new Date())).toBe(false);
    expect(type.isObject(new Error())).toBe(false);
    expect(type.isObject([])).toBe(false);
    expect(type.isObject(Object.setPrototypeOf([], Object.prototype))).toBe(false);
  });

  test('reads the constructor once', () => {
    let reads = 0;
    const value = {
      get constructor() {
        reads += 1;
        return Plain;
      },
    };
    expect(type.typeOf(value)).toBe('object');
    expect(reads).toBe(1);
  });
});
