/* eslint-disable require-yield */

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

import type from './type.js';

const expectToStrictEqual = (result, value) => {
  expect(result).toStrictEqual(value);
};
const expectToEqual = (result, value) => {
  expect(result).toEqual(value);
};

test('type - isArray', () => {
  const value = [];
  expect(type.isArray(value)).toEqual(true);
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
test('type - isRegExp', () => {
  const value = /aa/g;
  expect(type.isRegExp(value)).toEqual(true);
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
    expectToStrictEqual(type.typeOf(promise), 'promise');
  });

  test('should work for rejected promises', () => {
    const promise = Promise.reject(new Error('foo bar'));
    promise.catch(() => {});
    expectToStrictEqual(type.typeOf(promise), 'promise');
  });

  test('should work for generator functions', () => {
    const gen = function* named() {
      return true;
    };
    expectToEqual(type.typeOf(gen), 'generatorfunction');
  });

  test('should work for generator objects', () => {
    const gen = function* named() {
      return true;
    };
    expectToEqual(type.typeOf(gen()), 'generator');
  });

  test('should work for template strings', () => {
    /* eslint quotes: 0 */
    const name = 'Foo';
    expectToEqual(type.typeOf(`Welcome ${name} buddy`), 'string');
  });

  test('should work for Map', () => {
    const map = new Map();
    expectToEqual(type.typeOf(map), 'map');
    expectToEqual(type.typeOf(map.set), 'function');
    expectToEqual(type.typeOf(map.get), 'function');
    expectToEqual(type.typeOf(map.add), 'undefined');
  });

  test('should work for WeakMap', () => {
    const weakmap = new WeakMap();
    expectToEqual(type.typeOf(weakmap), 'weakmap');
    expectToEqual(type.typeOf(weakmap.set), 'function');
    expectToEqual(type.typeOf(weakmap.get), 'function');
    expectToEqual(type.typeOf(weakmap.add), 'undefined');
  });

  test('should work for Set', () => {
    const set = new Set();
    expectToEqual(type.typeOf(set), 'set');
    expectToEqual(type.typeOf(set.add), 'function');
    expectToEqual(type.typeOf(set.set), 'undefined');
    expectToEqual(type.typeOf(set.get), 'undefined');
  });

  test('should work for WeakSet', () => {
    const weakset = new WeakSet();
    expectToEqual(type.typeOf(weakset), 'weakset');
    expectToEqual(type.typeOf(weakset.add), 'function');
    expectToEqual(type.typeOf(weakset.set), 'undefined');
    expectToEqual(type.typeOf(weakset.get), 'undefined');
  });

  test('should work for Set Iterator', () => {
    const SetValuesIterator = new Set().values();
    expectToEqual(type.typeOf(SetValuesIterator), 'setiterator');
  });
  test('should work for Map Iterator', () => {
    const MapValuesIterator = new Map().values();
    expectToEqual(type.typeOf(MapValuesIterator), 'mapiterator');
  });
  test('should work for Array Iterator', () => {
    const ArrayEntriesIterator = [].entries();
    expectToEqual(type.typeOf(ArrayEntriesIterator), 'arrayiterator');
  });
  test('should work for String Iterator', () => {
    const StringCharIterator = ''[Symbol.iterator]();
    expectToEqual(type.typeOf(StringCharIterator), 'stringiterator');
  });

  test('should work for Symbol', () => {
    expectToEqual(type.typeOf(Symbol('foo')), 'symbol');
    expectToEqual(type.typeOf(Symbol.prototype), 'symbol');
  });

  test('should work for Int8Array', () => {
    const int8array = new Int8Array();
    expectToEqual(type.typeOf(int8array), 'int8array');
  });

  test('should work for Uint8Array', () => {
    const uint8array = new Uint8Array();
    expectToEqual(type.typeOf(uint8array), 'uint8array');
  });

  test('should work for Uint8ClampedArray', () => {
    const uint8clampedarray = new Uint8ClampedArray();
    expectToEqual(type.typeOf(uint8clampedarray), 'uint8clampedarray');
  });

  test('should work for Int16Array', () => {
    const int16array = new Int16Array();
    expectToEqual(type.typeOf(int16array), 'int16array');
  });

  test('should work for Uint16Array', () => {
    const uint16array = new Uint16Array();
    expectToEqual(type.typeOf(uint16array), 'uint16array');
  });

  test('should work for Int32Array', () => {
    const int32array = new Int32Array();
    expectToEqual(type.typeOf(int32array), 'int32array');
  });

  test('should work for Uint32Array', () => {
    const uint32array = new Uint32Array();
    expectToEqual(type.typeOf(uint32array), 'uint32array');
  });

  test('should work for Float32Array', () => {
    const float32array = new Float32Array();
    expectToEqual(type.typeOf(float32array), 'float32array');
  });

  test('should work for Float64Array', () => {
    const float64array = new Float64Array();
    expectToEqual(type.typeOf(float64array), 'float64array');
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
