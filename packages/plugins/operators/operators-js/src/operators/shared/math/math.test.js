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

import _math from './math.js';

test('_math called with no method or params', () => {
  expect(() => _math({ location: 'locationId' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _math requires a valid method name, use one of the following: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sin, sinh, sqrt, tan, tanh, trunc, E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2.
            Received: {\\"_math.undefined\\":undefined} at locationId."
  `);
});

test('_math invalid method or params', () => {
  expect(() => _math({ params: 'X', location: 'locationId' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _math requires a valid method name, use one of the following: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sin, sinh, sqrt, tan, tanh, trunc, E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2.
            Received: {\\"_math.undefined\\":\\"X\\"} at locationId."
  `);
});

test('_math invalid method', () => {
  expect(() => _math({ params: [1], methodName: 'X', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _math.X is not supported, use one of the following: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sin, sinh, sqrt, tan, tanh, trunc, E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2.
          Received: {\\"_math.X\\":[1]} at locationId."
  `);
});

test('_math invalid method args', () => {
  expect(() => _math({ params: 'X', methodName: 'min', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _math.min accepts one of the following types: array.
          Received: {\\"_math.min\\":\\"X\\"} at locationId."
  `);
  expect(() => _math({ params: 'X', methodName: 'pow', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _math.pow accepts one of the following types: object, array.
          Received: {\\"_math.pow\\":\\"X\\"} at locationId."
  `);
});

test('_math valid functions', () => {
  expect(_math({ methodName: 'abs', params: -2, location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'acos', params: 0.1, location: 'locationId' })).toBe(
    1.4706289056333368
  );
  expect(_math({ methodName: 'acosh', params: 2, location: 'locationId' })).toBe(
    1.3169578969248166
  );
  expect(_math({ methodName: 'asin', params: 0.2, location: 'locationId' })).toBe(
    0.2013579207903308
  );
  expect(_math({ methodName: 'asinh', params: 2, location: 'locationId' })).toBe(
    1.4436354751788103
  );
  expect(_math({ methodName: 'atan', params: 2, location: 'locationId' })).toBe(1.1071487177940904);
  expect(_math({ methodName: 'atan2', params: [0.1, 1], location: 'locationId' })).toBe(
    0.09966865249116204
  );
  expect(_math({ methodName: 'atan2', params: { x: 0.1, y: 1 }, location: 'locationId' })).toBe(
    0.09966865249116204
  );
  expect(_math({ methodName: 'atanh', params: 0.1, location: 'locationId' })).toBe(
    0.10033534773107558
  );
  expect(_math({ methodName: 'cbrt', params: 2, location: 'locationId' })).toBe(1.2599210498948732);
  expect(_math({ methodName: 'ceil', params: 2.2, location: 'locationId' })).toBe(3);
  expect(_math({ methodName: 'clz32', params: 2, location: 'locationId' })).toBe(30);
  expect(_math({ methodName: 'cos', params: 2, location: 'locationId' })).toBe(-0.4161468365471424);
  expect(_math({ methodName: 'cosh', params: 2, location: 'locationId' })).toBe(3.7621956910836314);
  expect(_math({ methodName: 'exp', params: 2, location: 'locationId' })).toBe(7.38905609893065);
  expect(_math({ methodName: 'expm1', params: 2, location: 'locationId' })).toBe(6.38905609893065);
  expect(_math({ methodName: 'floor', params: 0.1, location: 'locationId' })).toBe(0);
  expect(_math({ methodName: 'fround', params: 2, location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'hypot', params: [2, 2], location: 'locationId' })).toBe(
    2.8284271247461903
  );
  expect(_math({ methodName: 'imul', params: [1, 2], location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'imul', params: { a: 1, b: 2 }, location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'exp', params: 2, location: 'locationId' })).toBe(7.38905609893065);
  expect(_math({ methodName: 'log', params: 2, location: 'locationId' })).toBe(0.6931471805599453);
  expect(_math({ methodName: 'log10', params: 2.3, location: 'locationId' })).toBe(
    0.36172783601759284
  );
  expect(_math({ methodName: 'log1p', params: 2, location: 'locationId' })).toBe(
    1.0986122886681096
  );
  expect(_math({ methodName: 'log2', params: 2, location: 'locationId' })).toBe(1);
  expect(_math({ methodName: 'max', params: [2, 4], location: 'locationId' })).toBe(4);
  expect(_math({ methodName: 'min', params: [2, 1], location: 'locationId' })).toBe(1);
  expect(_math({ methodName: 'pow', params: [2, 3], location: 'locationId' })).toBe(8);
  expect(
    _math({ methodName: 'pow', params: { base: 2, exponent: 3 }, location: 'locationId' })
  ).toBe(8);

  const mathRandomFn = Math.random;
  Math.random = () => 0.5234;
  expect(_math({ methodName: null, params: 'random', location: 'locationId' })).toBe(0.5234);
  expect(_math({ methodName: 'random', params: 1, location: 'locationId' })).toBe(0.5234);
  Math.random = mathRandomFn;

  expect(_math({ methodName: 'round', params: 2.3, location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'sign', params: -2, location: 'locationId' })).toBe(-1);
  expect(_math({ methodName: 'sin', params: 2, location: 'locationId' })).toBe(0.9092974268256817);
  expect(_math({ methodName: 'sinh', params: 0.2, location: 'locationId' })).toBe(
    0.20133600254109402
  );
  expect(_math({ methodName: 'sqrt', params: 2, location: 'locationId' })).toBe(1.4142135623730951);
  expect(_math({ methodName: 'tan', params: 2, location: 'locationId' })).toBe(-2.185039863261519);
  expect(_math({ methodName: 'tanh', params: 0.2, location: 'locationId' })).toBe(
    0.197375320224904
  );
  expect(_math({ methodName: 'trunc', params: 2.5, location: 'locationId' })).toBe(2);
  expect(_math({ methodName: 'E', params: null, location: 'locationId' })).toBe(2.718281828459045);
  expect(_math({ methodName: 'E', location: 'locationId' })).toBe(2.718281828459045);
  expect(_math({ methodName: 'LN10', location: 'locationId' })).toBe(2.302585092994046);
  expect(_math({ methodName: 'LN2', location: 'locationId' })).toBe(0.6931471805599453);
  expect(_math({ methodName: 'LOG10E', location: 'locationId' })).toBe(0.4342944819032518);
  expect(_math({ methodName: 'LOG2E', location: 'locationId' })).toBe(1.4426950408889634);
  expect(_math({ methodName: 'PI', location: 'locationId' })).toBe(3.141592653589793);
  expect(_math({ methodName: 'SQRT1_2', location: 'locationId' })).toBe(0.7071067811865476);
  expect(_math({ methodName: 'SQRT2', location: 'locationId' })).toBe(1.4142135623730951);
});
