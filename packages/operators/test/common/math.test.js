import _math from '../../src/common/math';

test('_math called not with an object', () => {
  expect(() => _math({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _math takes an object type as input. Received: null at locationId.'
  );
});

test('_math.property', () => {
  const properties = ['E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2'];
  properties.forEach((property) => {
    expect(_math({ params: { property }, location: 'locationId' })).toBe(Math[property]);
  });
});

test('_math.property invalid', () => {
  expect(() => _math({ params: { property: true }, location: 'locationId' })).toThrow(
    `Operator Error: _math.property takes can be one of 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2' or 'SQRT2'. Received: {"property":true} at locationId.`
  );
  expect(() => _math({ params: { property: 'X' }, location: 'locationId' })).toThrow(
    `Operator Error: _math.property takes can be one of 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2' or 'SQRT2'. Received: {"property":"X"} at locationId.`
  );
});

test('_math.method', () => {
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
    expect(_math({ params: { method, args }, location: 'locationId' })).toEqual(
      Math[method](...args)
    );
  });
  Math.random = () => 0.5234;
  const mathRandomFn = Math.random;
  expect(_math({ params: { method: 'random' }, location: 'locationId' })).toEqual(0.5234);
  Math.random = mathRandomFn;
});

test('_math.method invalid', () => {
  expect(() => _math({ params: { method: true }, location: 'locationId' })).toThrow(
    `Operator Error: _math.property takes can be one of 'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sinh', 'sqrt', 'tan', 'tanh' or 'trunc'. Received: {"method":true} at locationId.`
  );
  expect(() => _math({ params: { method: 'X' }, location: 'locationId' })).toThrow(
    `Operator Error: _math.property takes can be one of 'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sinh', 'sqrt', 'tan', 'tanh' or 'trunc'. Received: {"method":"X"} at locationId.`
  );
});

test('_math.args invalid', () => {
  expect(() =>
    _math({ params: { method: 'min', args: { x: 1 } }, location: 'locationId' })
  ).toThrow(
    'Operator Error: _math.args takes an array type as input. Received: {"method":"min","args":{"x":1}} at locationId.'
  );
});
