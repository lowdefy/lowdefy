import _math from '../../src/common/math';

test('_math called with no method or params', () => {
  expect(() => _math({ location: 'locationId' })).toThrow(
    'Operator Error: _math must be called with one of the following properties: E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2. Or Methods: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sinh, sqrt, tan, tanh, trunc. Received: undefined at locationId.'
  );
});

test('_math valid properties', () => {
  const properties = ['E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2'];
  properties.forEach((property) => {
    expect(_math({ params: property, location: 'locationId' })).toBe(Math[property]);
  });
});

test('_math invalid property', () => {
  expect(() => _math({ params: 'X', location: 'locationId' })).toThrow(
    'Operator Error: _math must be called with one of the following values: E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2. Received: {"_math":"X"} at locationId.'
  );
});

test('_math valid methods', () => {
  const args = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const methods = [
    'abs',
    'acos',
    'acosh',
    'asin',
    'asinh',
    'atan',
    'atan2',
    'atanh',
    'cbrt',
    'ceil',
    'clz32',
    'cos',
    'cosh',
    'exp',
    'expm1',
    'floor',
    'fround',
    'hypot',
    'imul',
    'log',
    'log10',
    'log1p',
    'log2',
    'max',
    'min',
    'pow',
    // 'random',
    'round',
    'sign',
    'sinh',
    'sqrt',
    'tan',
    'tanh',
    'trunc',
  ];
  methods.forEach((method) => {
    expect(_math({ params: args, method, location: 'locationId' })).toEqual(Math[method](...args));
  });
  Math.random = () => 0.5234;
  const mathRandomFn = Math.random;
  expect(_math({ params: args, method: 'random', location: 'locationId' })).toEqual(0.5234);
  Math.random = mathRandomFn;
});

test('_math invalid method', () => {
  expect(() => _math({ params: { method: 'X' }, location: 'locationId' })).toThrow(
    `Operator Error: _math must be called with one of the following properties: E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2. Or Methods: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sinh, sqrt, tan, tanh, trunc. Received: {"method":"X"} at locationId.`
  );
});

test('_math invalid method args', () => {
  expect(() => _math({ params: 'X', method: 'min', location: 'locationId' })).toThrow(
    `Operator Error: _math must be called with one of the following properties: E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2. Or Methods: abs, acos, acosh, asin, asinh, atan, atan2, atanh, cbrt, ceil, clz32, cos, cosh, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, random, round, sign, sinh, sqrt, tan, tanh, trunc. Received: "X" at locationId.`
  );
});
