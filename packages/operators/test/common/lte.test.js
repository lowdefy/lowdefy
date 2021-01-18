import lte from '../../src/common/lte';

test('_lte param 0 less than param 1', () => {
  expect(lte({ params: [1, 1], location: 'locationId' })).toBe(true);
  expect(lte({ params: [0, 1], location: 'locationId' })).toBe(true);
  expect(lte({ params: [-1, 0], location: 'locationId' })).toBe(true);
  expect(lte({ params: [-1, 1], location: 'locationId' })).toBe(true);
  expect(lte({ params: [0.1, 0.2], location: 'locationId' })).toBe(true);
});

test('_lte param 0 greater than param 1', () => {
  expect(lte({ params: [1, 0], location: 'locationId' })).toBe(false);
  expect(lte({ params: [0, -1], location: 'locationId' })).toBe(false);
  expect(lte({ params: [1, -1], location: 'locationId' })).toBe(false);
  expect(lte({ params: [0.2, 0.1], location: 'locationId' })).toBe(false);
});

test('_lte params not an array', () => {
  expect(() => lte({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _lte takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_lte params array with length 1', () => {
  expect(() => lte({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _lte takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_lte params array with length 3', () => {
  expect(() => lte({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _lte takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_lte params array with non numbers', () => {
  expect(() => lte({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _lte takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => lte({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _lte takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
