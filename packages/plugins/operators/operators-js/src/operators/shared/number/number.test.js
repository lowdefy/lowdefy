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

import _number from './number.js';

test('_number called with no method or params', () => {
  expect(() => _number({ location: 'locationId' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _number requires a valid method name, use one of the following: EPSILON, MAX_SAFE_INTEGER, MAX_VALUE, MIN_SAFE_INTEGER, MIN_VALUE, NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY, isFinite, isInteger, isNaN, isSafeInteger, parseFloat, parseInt, toExponential, toFixed, toLocaleString, toPrecision, toString.
            Received: {\\"_number.undefined\\":undefined} at locationId."
  `);
});

test('_number invalid method or params', () => {
  expect(() => _number({ params: 'X', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _number requires a valid method name, use one of the following: EPSILON, MAX_SAFE_INTEGER, MAX_VALUE, MIN_SAFE_INTEGER, MIN_VALUE, NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY, isFinite, isInteger, isNaN, isSafeInteger, parseFloat, parseInt, toExponential, toFixed, toLocaleString, toPrecision, toString.
            Received: {\\"_number.undefined\\":\\"X\\"} at locationId."
  `);
});

test('_number invalid method', () => {
  expect(() => _number({ params: [1], methodName: 'X', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _number.X is not supported, use one of the following: EPSILON, MAX_SAFE_INTEGER, MAX_VALUE, MIN_SAFE_INTEGER, MIN_VALUE, NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY, isFinite, isInteger, isNaN, isSafeInteger, parseFloat, parseInt, toExponential, toFixed, toLocaleString, toPrecision, toString.
          Received: {\\"_number.X\\":[1]} at locationId."
  `);
});

test('_number invalid method args', () => {
  expect(() => _number({ params: 'X', methodName: 'toFixed', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _number.toFixed accepts one of the following types: array, object.
          Received: {\\"_number.toFixed\\":\\"X\\"} at locationId."
  `);
});

test('_number valid functions', () => {
  expect(
    _number({ methodName: 'toExponential', params: [77.1234, 2], location: 'locationId' })
  ).toBe('7.71e+1');
  expect(_number({ methodName: 'toFixed', params: [12.3456, 2], location: 'locationId' })).toBe(
    '12.35'
  );
  expect(
    _number({ methodName: 'toLocaleString', params: [123456.789, 'de-DE'], location: 'locationId' })
  ).toBe('123.456,789');
  expect(
    _number({ methodName: 'toPrecision', params: [5.123456, 2], location: 'locationId' })
  ).toBe('5.1');
  expect(_number({ methodName: 'toString', params: [5.1], location: 'locationId' })).toBe('5.1');
  expect(_number({ methodName: 'EPSILON', params: [true], location: 'locationId' })).toBe(
    Number.EPSILON
  );
  expect(_number({ methodName: 'MAX_SAFE_INTEGER', params: [true], location: 'locationId' })).toBe(
    Number.MAX_SAFE_INTEGER
  );
  expect(_number({ methodName: 'MAX_VALUE', params: [true], location: 'locationId' })).toBe(
    Number.MAX_VALUE
  );
  expect(_number({ methodName: 'MIN_SAFE_INTEGER', params: [true], location: 'locationId' })).toBe(
    Number.MIN_SAFE_INTEGER
  );
  expect(_number({ methodName: 'MIN_VALUE', params: [true], location: 'locationId' })).toBe(
    Number.MIN_VALUE
  );
  expect(_number({ methodName: 'NaN', params: [true], location: 'locationId' })).toBe(Number.NaN);
  expect(_number({ methodName: 'NEGATIVE_INFINITY', params: [true], location: 'locationId' })).toBe(
    Number.NEGATIVE_INFINITY
  );
  expect(_number({ methodName: 'POSITIVE_INFINITY', params: [true], location: 'locationId' })).toBe(
    Number.POSITIVE_INFINITY
  );
  expect(_number({ methodName: 'isFinite', params: 2e64, location: 'locationId' })).toBe(true);
  expect(_number({ methodName: 'isInteger', params: -100000, location: 'locationId' })).toBe(true);
  expect(_number({ methodName: 'isNaN', params: NaN, location: 'locationId' })).toBe(true);
  expect(_number({ methodName: 'isSafeInteger', params: 3, location: 'locationId' })).toBe(true);
  expect(_number({ methodName: 'isSafeInteger', params: Infinity, location: 'locationId' })).toBe(
    false
  );
  expect(
    _number({ methodName: 'parseFloat', params: '4.567abcdefgh', location: 'locationId' })
  ).toBe(4.567);
  expect(_number({ methodName: 'parseInt', params: [' 0xF', 16], location: 'locationId' })).toBe(
    15
  );
});
