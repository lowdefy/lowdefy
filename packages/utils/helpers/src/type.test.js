/* eslint-disable require-yield */

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

import type from './type.js';

test('type - isArray', () => {
  expect(type.isArray([])).toEqual(true);
  expect(type.isArray([1, 2])).toEqual(true);
  expect(type.isArray({})).toEqual(false);
  expect(type.isArray('a')).toEqual(false);
});
test('type - isObject', () => {
  const value = {};
  expect(type.isObject(value)).toEqual(true);
  expect(type.isObject(new Date())).toEqual(false);
});
test('type - isString', () => {
  const value = 'a';
  expect(type.isString(value)).toEqual(true);
});
test('type - isDate - should be valid date', () => {
  let value = new Date('2019-04-01');
  expect(type.isDate(value)).toEqual(true);
  value = new Date();
  expect(type.isDate(value)).toEqual(true);
  value = new Date('c');
  expect(type.isDate(value)).toEqual(false);
});
test('type - isDate returns false for an invalid Date', () => {
  expect(type.isDate(new Date('garbage'))).toEqual(false);
});
test('type - isDate returns false for date-like objects', () => {
  const dateLike = {
    toDateString: () => 'Mon Apr 01 2019',
    getDate: () => 1,
    setDate: () => 1,
    getTime: () => 1554076800000,
  };
  expect(type.isDate(dateLike)).toEqual(false);
});
test('type - isRegExp', () => {
  const value = /aa/g;
  expect(type.isRegExp(value)).toEqual(true);
});
test('type - isRegExp returns false for regexp-like objects', () => {
  const regexpLike = { flags: 'g', ignoreCase: false, multiline: false, global: true };
  expect(type.isRegExp(regexpLike)).toEqual(false);
});
test('type - isFunction', () => {
  const value = () => false;
  expect(type.isFunction(value)).toEqual(true);
});
test('type - isBoolean', () => {
  const value = false;
  expect(type.isBoolean(value)).toEqual(true);
});
test('type - isNumber - must be finite', () => {
  const value = 0;
  expect(type.isNumber(value)).toEqual(true);
  const a = Number.NaN;
  expect(type.isNumber(a)).toEqual(false);
});
test('type - isNumeric', () => {
  expect(type.isNumeric(123)).toEqual(true);
  expect(type.isNumeric(123.1)).toEqual(true);
  expect(type.isNumeric('123')).toEqual(true);
  expect(type.isNumeric('1e10000')).toEqual(true);
  expect(type.isNumeric('foo')).toEqual(false);
  expect(type.isNumeric('10px')).toEqual(false);
  const a = Number.NaN;
  expect(type.isNumeric(a)).toEqual(false);
});
test('type - isInt', () => {
  const value = 1;
  expect(type.isInt(value)).toEqual(true);
});
test('type - isError', () => {
  const value = new Error();
  expect(type.isError(value)).toEqual(true);
  expect(type.isError(null)).toEqual(false);
  expect(type.isError(undefined)).toEqual(false);
});
test('type - isError returns true for Error subclasses', () => {
  expect(type.isError(new TypeError('x'))).toEqual(true);
  expect(type.isError(new RangeError('x'))).toEqual(true);
  class CustomError extends Error {}
  expect(type.isError(new CustomError('x'))).toEqual(true);
});
test('type - isError returns false for error-like objects', () => {
  const errorLike = { message: 'not an error', constructor: { stackTraceLimit: 10 } };
  expect(type.isError(errorLike)).toEqual(false);
});
test('type - isNull', () => {
  const value = null;
  expect(type.isNull(value)).toEqual(true);
});
test('type - isUndefined', () => {
  expect(type.isUndefined(undefined)).toEqual(true);
  expect(type.isUndefined(null)).toEqual(false);
  expect(type.isUndefined(0)).toEqual(false);
  expect(type.isUndefined('')).toEqual(false);
  expect(type.isUndefined(false)).toEqual(false);
});
test('type - isNone', () => {
  let value;
  expect(type.isNone(value)).toEqual(true);
  value = null;
  expect(type.isNone(value)).toEqual(true);
  const a = Number.NaN;
  expect(type.isNone(a)).toEqual(false);
  const b = new Date('a');
  expect(type.isNone(b)).toEqual(false);
});
test('type - isPrimitive', () => {
  let value;
  expect(type.isPrimitive(value)).toEqual(true);
  value = null;
  expect(type.isPrimitive(value)).toEqual(true);
  value = 0;
  expect(type.isPrimitive(value)).toEqual(true);
  value = 'a';
  expect(type.isPrimitive(value)).toEqual(true);
  value = new Date('2019-04-01');
  expect(type.isPrimitive(value)).toEqual(true);
  value = false;
  expect(type.isPrimitive(value)).toEqual(true);
  const a = Number.NaN;
  expect(type.isPrimitive(a)).toEqual(true);
  const b = new Date('a');
  expect(type.isPrimitive(b)).toEqual(true);
});
test('type - isPrimitive treats date as primitive by Lowdefy convention', () => {
  expect(type.isPrimitive(new Date('2019-04-01'))).toEqual(true);
  expect(type.isPrimitive({})).toEqual(false);
  expect(type.isPrimitive([])).toEqual(false);
});

test('type - typeOf', () => {
  let value = [];
  expect(type.typeOf(value)).toEqual('array');
  value = {};
  expect(type.typeOf(value)).toEqual('object');
  value = 'a';
  expect(type.typeOf(value)).toEqual('string');
  value = 0;
  expect(type.typeOf(value)).toEqual('number');
  value = new Date('2000-01-01');
  expect(type.typeOf(value)).toEqual('date');
  value = /a/;
  expect(type.typeOf(value)).toEqual('regexp');
  value = () => false;
  expect(type.typeOf(value)).toEqual('function');
  value = false;
  expect(type.typeOf(value)).toEqual('boolean');
  value = null;
  expect(type.typeOf(value)).toEqual('null');
  value = undefined;
  expect(type.typeOf(value)).toEqual('undefined');
  const a = Number.NaN;
  expect(type.typeOf(a)).toEqual('number');
  const b = new Date('a');
  expect(type.typeOf(b)).toEqual('date');
});

test('type - isEmptyObject', () => {
  expect(type.isEmptyObject({})).toEqual(true);
  expect(type.isEmptyObject({ a: 1 })).toEqual(false);
  expect(type.isEmptyObject('no')).toEqual(false);
  expect(type.isEmptyObject([])).toEqual(false);
  expect(type.isEmptyObject(new Date())).toEqual(false);
});

describe('es6 features', () => {
  test('should work for resolved promises', () => {
    const promise = Promise.resolve(123);
    expect(type.typeOf(promise)).toStrictEqual('promise');
  });

  test('should work for rejected promises', () => {
    const promise = Promise.reject(new Error('foo bar'));
    promise.catch(() => {});
    expect(type.typeOf(promise)).toStrictEqual('promise');
  });

  test('should work for template strings', () => {
    /* eslint quotes: 0 */
    const name = 'Foo';
    expect(type.typeOf(`Welcome ${name} buddy`)).toEqual('string');
  });

  test('should work for Map', () => {
    const map = new Map();
    expect(type.typeOf(map)).toEqual('map');
    expect(type.typeOf(map.set)).toEqual('function');
    expect(type.typeOf(map.get)).toEqual('function');
    expect(type.typeOf(map.add)).toEqual('undefined');
  });

  test('should work for WeakMap', () => {
    const weakmap = new WeakMap();
    expect(type.typeOf(weakmap)).toEqual('weakmap');
    expect(type.typeOf(weakmap.set)).toEqual('function');
    expect(type.typeOf(weakmap.get)).toEqual('function');
    expect(type.typeOf(weakmap.add)).toEqual('undefined');
  });

  test('should work for Set', () => {
    const set = new Set();
    expect(type.typeOf(set)).toEqual('set');
    expect(type.typeOf(set.add)).toEqual('function');
    expect(type.typeOf(set.set)).toEqual('undefined');
    expect(type.typeOf(set.get)).toEqual('undefined');
  });

  test('should work for WeakSet', () => {
    const weakset = new WeakSet();
    expect(type.typeOf(weakset)).toEqual('weakset');
    expect(type.typeOf(weakset.add)).toEqual('function');
    expect(type.typeOf(weakset.set)).toEqual('undefined');
    expect(type.typeOf(weakset.get)).toEqual('undefined');
  });

  test('should work for Symbol', () => {
    expect(type.typeOf(Symbol('foo'))).toEqual('symbol');
    expect(type.typeOf(Symbol.prototype)).toEqual('symbol');
  });

  test('should work for Int8Array', () => {
    const int8array = new Int8Array();
    expect(type.typeOf(int8array)).toEqual('int8array');
  });

  test('should work for Uint8Array', () => {
    const uint8array = new Uint8Array();
    expect(type.typeOf(uint8array)).toEqual('uint8array');
  });

  test('should work for Uint8ClampedArray', () => {
    const uint8clampedarray = new Uint8ClampedArray();
    expect(type.typeOf(uint8clampedarray)).toEqual('uint8clampedarray');
  });

  test('should work for Int16Array', () => {
    const int16array = new Int16Array();
    expect(type.typeOf(int16array)).toEqual('int16array');
  });

  test('should work for Uint16Array', () => {
    const uint16array = new Uint16Array();
    expect(type.typeOf(uint16array)).toEqual('uint16array');
  });

  test('should work for Int32Array', () => {
    const int32array = new Int32Array();
    expect(type.typeOf(int32array)).toEqual('int32array');
  });

  test('should work for Uint32Array', () => {
    const uint32array = new Uint32Array();
    expect(type.typeOf(uint32array)).toEqual('uint32array');
  });

  test('should work for Float32Array', () => {
    const float32array = new Float32Array();
    expect(type.typeOf(float32array)).toEqual('float32array');
  });

  test('should work for Float64Array', () => {
    const float64array = new Float64Array();
    expect(type.typeOf(float64array)).toEqual('float64array');
  });
});

describe('modernized kindOf dispatch', () => {
  test('typeOf returns "buffer" for a Node Buffer', () => {
    // Buffer extends Uint8Array, so the constructor-name regex must match "Buffer"
    // before anything can fall through to a Uint8Array result.
    expect(type.typeOf(Buffer.from('x'))).toEqual('buffer');
    expect(type.typeOf(Buffer.alloc(0))).toEqual('buffer');
  });

  test('typeOf returns "object" for an arguments object', () => {
    const args = (function collect() {
      return arguments;
    })(1, 2);
    expect(type.typeOf(args)).toEqual('object');
  });

  test('typeOf returns "object" for an arguments-like object', () => {
    expect(type.typeOf({ length: 0, callee: () => {} })).toEqual('object');
  });

  test('typeOf returns "function" for a generator function', () => {
    const gen = function* named() {
      return true;
    };
    expect(type.typeOf(gen)).toEqual('function');
    expect(type.isFunction(gen)).toEqual(true);
  });

  test('typeOf returns "function" for an async generator function', () => {
    const gen = async function* named() {
      return true;
    };
    expect(type.typeOf(gen)).toEqual('function');
  });

  test('typeOf returns "object" for a generator object', () => {
    const gen = function* named() {
      return true;
    };
    expect(type.typeOf(gen())).toEqual('object');
  });

  test('typeOf no longer returns the iterator tags', () => {
    // The exact fall-through value is Node-version dependent — 'iterator' where the
    // `Iterator` global puts a constructor on %IteratorPrototype% (Node 22+), 'object'
    // otherwise. The contract is that the dropped `[object * Iterator]` branches never
    // come back.
    expect(type.typeOf(new Map().entries())).not.toEqual('mapiterator');
    expect(type.typeOf(new Set().values())).not.toEqual('setiterator');
    expect(type.typeOf([].entries())).not.toEqual('arrayiterator');
    expect(type.typeOf(''[Symbol.iterator]())).not.toEqual('stringiterator');
  });

  test('typeOf returns the lowercased constructor name for non-plain objects', () => {
    expect(type.typeOf(new URL('http://x'))).toEqual('url');
    expect(type.typeOf(new URLSearchParams('a=1'))).toEqual('urlsearchparams');
    expect(type.typeOf(new Headers())).toEqual('headers');
  });

  test('typeOf returns "object" for a null-prototype object', () => {
    expect(type.typeOf(Object.create(null))).toEqual('object');
  });

  test('typeOf returns "object" for a class instance without Symbol.toStringTag', () => {
    class Bar {}
    expect(type.typeOf(new Bar())).toEqual('object');
  });

  test('typeOf returns the lowercased class name when Symbol.toStringTag is set', () => {
    class Foo {
      get [Symbol.toStringTag]() {
        return 'Foo';
      }
    }
    expect(type.typeOf(new Foo())).toEqual('foo');
  });

  test('typeOf returns "symbol" for a boxed symbol', () => {
    // Object(Symbol()) reports `[object Symbol]`, so it falls past the plain-object tail
    // check to the constructor-name branch. Unchanged from the legacy implementation.
    expect(type.typeOf(Object(Symbol('foo')))).toEqual('symbol');
  });
});

describe('isObject keeps its plain-object-only contract', () => {
  test('isObject returns true for object literals and null-prototype objects', () => {
    expect(type.isObject({})).toEqual(true);
    expect(type.isObject({ a: 1 })).toEqual(true);
    expect(type.isObject(Object.create(null))).toEqual(true);
  });

  test('isObject returns false for web platform objects', () => {
    expect(type.isObject(new URL('http://x'))).toEqual(false);
    expect(type.isObject(new URLSearchParams('a=1'))).toEqual(false);
    expect(type.isObject(new Headers())).toEqual(false);
  });

  test('isObject returns false for class instances with Symbol.toStringTag', () => {
    class Foo {
      get [Symbol.toStringTag]() {
        return 'Foo';
      }
    }
    expect(type.isObject(new Foo())).toEqual(false);
  });

  test('isObject returns false for arrays, errors, maps and buffers', () => {
    expect(type.isObject([])).toEqual(false);
    expect(type.isObject(new Error('x'))).toEqual(false);
    expect(type.isObject(new Map())).toEqual(false);
    expect(type.isObject(Buffer.from('x'))).toEqual(false);
  });
});

describe('removed legacy predicates', () => {
  test('type does not export the removed duck-typed predicates', () => {
    expect(type.isBuffer).toBeUndefined();
    expect(type.isArguments).toBeUndefined();
    expect(type.isGeneratorFn).toBeUndefined();
    expect(type.isGeneratorObj).toBeUndefined();
  });

  test('type exports exactly the documented predicate surface', () => {
    expect(Object.keys(type).sort()).toEqual(
      [
        'enforceType',
        'isArray',
        'isBoolean',
        'isDate',
        'isDateString',
        'isEmptyObject',
        'isError',
        'isFunction',
        'isInt',
        'isName',
        'isNone',
        'isNull',
        'isNumber',
        'isNumeric',
        'isObject',
        'isOpRequest',
        'isPrimitive',
        'isRegExp',
        'isSet',
        'isString',
        'isUndefined',
        'typeOf',
      ].sort()
    );
  });
});

describe('Lowdefy types', () => {
  test('isName', () => {
    expect(type.isName('8')).toEqual(false);
    expect(type.isName('8a')).toEqual(false);
    expect(type.isName('a8')).toEqual(true);
    expect(type.isName('aB1')).toEqual(true);
    expect(type.isName(true)).toEqual(false);
    expect(type.isName(1)).toEqual(false);
    expect(type.isName(0)).toEqual(false);
    expect(type.isName('name#')).toEqual(false);
    expect(type.isName('na!me')).toEqual(false);
    expect(type.isName('$name')).toEqual(false);
    expect(type.isName('name_field')).toEqual(true);
    expect(type.isName('$n#ame_fiel-d+')).toEqual(false);
    expect(type.isName('$n#am`e_fie`l-d+')).toEqual(false);
    expect(type.isName('$n#am`e_f"i"e`l-d+')).toEqual(false);
    expect(type.isName("$n#a'm`e_'fie`l-d+")).toEqual(false);
    expect(type.isName('*n"}a:{}m.e,')).toEqual(false);
    expect(type.isName('  name')).toEqual(false);
    expect(type.isName('name ')).toEqual(false);
    expect(type.isName('na me')).toEqual(false);
    expect(type.isName(' na me ')).toEqual(false);
    expect(type.isName('name.')).toEqual(false);
    expect(type.isName('.name')).toEqual(false);
    expect(type.isName('na.0me')).toEqual(false);
    expect(type.isName('0na.me')).toEqual(false);
    expect(type.isName('na.0')).toEqual(false);
    expect(type.isName('lowdefy_n')).toEqual(false);
    expect(type.isName('lOwDeFyname')).toEqual(false);

    expect(type.isName('na.me')).toEqual(true);
    expect(type.isName('na.me.a')).toEqual(true);
    expect(type.isName('na.me.a.b1')).toEqual(true);
  });
  test('isOpRequest', () => {
    expect(type.isOpRequest('a')).toEqual(false);
    expect(type.isOpRequest(true)).toEqual(false);
    expect(type.isOpRequest(false)).toEqual(false);
    expect(type.isOpRequest({})).toEqual(false);
    expect(type.isOpRequest({ _r: '1' })).toEqual(false);
    expect(type.isOpRequest({ request: '1' })).toEqual(false);
    expect(type.isOpRequest({ _request: '1' })).toEqual(false);
    expect(type.isOpRequest({ _request: 'a1' })).toEqual(true);
  });

  test('isDateString', () => {
    expect(type.isDateString('a')).toEqual(false);
    expect(type.isDateString(null)).toEqual(false);
    expect(type.isDateString(undefined)).toEqual(false);
    expect(type.isDateString(true)).toEqual(false);
    expect(type.isDateString(false)).toEqual(false);
    const a = new Date();
    expect(type.isDateString(a)).toEqual(false);
    expect(type.isDateString(a.toISOString())).toEqual(true);
  });
});

describe('enforceType values', () => {
  test('defined values pass normal', () => {
    const a = new Date();
    expect(type.enforceType('object', { a: 1 })).toEqual({ a: 1 });
    expect(type.enforceType('array', [0, 1])).toEqual([0, 1]);
    expect(type.enforceType('boolean', true)).toEqual(true);
    expect(type.enforceType('string', 'abc')).toEqual('abc');
    expect(type.enforceType('number', 12.2)).toEqual(12.2);
    expect(type.enforceType('number', 0)).toEqual(0);
    expect(type.enforceType('number', -1)).toEqual(-1);
    expect(type.enforceType('date', a)).toEqual(a);
    expect(type.enforceType('primitive', 'a')).toEqual('a');
    expect(type.enforceType('primitive', 0)).toEqual(0);
    expect(type.enforceType('primitive', 1)).toEqual(1);
    expect(type.enforceType('primitive', true)).toEqual(true);
    expect(type.enforceType('primitive', a)).toEqual(a);
    expect(type.enforceType('any', { x: 1 })).toEqual({ x: 1 });
    expect(type.enforceType('x', '1')).toEqual(null);
  });
  test('undefined values pass default', () => {
    expect(type.enforceType('object', undefined)).toEqual(null);
    expect(type.enforceType('array', undefined)).toEqual([]);
    expect(type.enforceType('boolean', undefined)).toEqual(false);
    expect(type.enforceType('primitive', undefined)).toEqual(null);
    expect(type.enforceType('string', undefined)).toEqual(null);
    expect(type.enforceType('number', undefined)).toEqual(null);
    expect(type.enforceType('date', undefined)).toEqual(null);
    expect(type.enforceType('any', undefined)).toEqual(null);
  });
  test('wrong values pass default', () => {
    const a = new Date('a');
    expect(type.enforceType('object', 1)).toEqual(null);
    expect(type.enforceType('array', 'a')).toEqual([]);
    expect(type.enforceType('boolean', 0)).toEqual(false);
    expect(type.enforceType('primitive', {})).toEqual(null);
    expect(type.enforceType('string', true)).toEqual(null);
    expect(type.enforceType('string', '')).toEqual(null);
    expect(type.enforceType('number', '1')).toEqual(null);
    expect(type.enforceType('date', a)).toEqual(null);
  });
});
