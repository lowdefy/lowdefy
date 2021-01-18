import divide from '../../src/common/divide';

test('_divide param 0 greater than param 1', () => {
  expect(divide({ params: [1, 1], location: 'locationId' })).toBe(1);
  expect(divide({ params: [0, -1], location: 'locationId' })).toBe(-0);
  expect(divide({ params: [1, -1], location: 'locationId' })).toBe(-1);
  expect(divide({ params: [0.2, 0.1], location: 'locationId' })).toBe(2);
});

test('_divide by zero', () => {
  expect(() =>
    divide({ params: [1, 0], location: 'locationId' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide by zero not allowed. Received: [1,0] at locationId."`
  );
});

test('_divide params not an array', () => {
  expect(() =>
    divide({ params: '1, 0', location: 'locationId' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide takes an array type as input. Received: \\"1, 0\\" at locationId."`
  );
});

test('_divide params array with length 1', () => {
  expect(() => divide({ params: [1], location: 'locationId' })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide takes an array of length 2 as input. Received: [1] at locationId."`
  );
});

test('_divide params array with length 3', () => {
  expect(() =>
    divide({ params: [1, 2, 3], location: 'locationId' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide takes an array of length 2 as input. Received: [1,2,3] at locationId."`
  );
});

test('_divide params array with non numbers', () => {
  expect(() =>
    divide({ params: ['1', 1], location: 'locationId' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide takes an array of 2 numbers. Received: [\\"1\\",1] at locationId."`
  );
  expect(() =>
    divide({ params: [1, '1'], location: 'locationId' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _divide takes an array of 2 numbers. Received: [1,\\"1\\"] at locationId."`
  );
});
