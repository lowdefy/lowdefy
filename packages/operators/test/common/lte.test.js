import lte from '../../src/common/lte';

const location = 'locationId';

test('_lte param 0 less than param 1', () => {
  expect(lte({ params: [1, 1], location })).toBe(true);
  expect(lte({ params: [0, 1], location })).toBe(true);
  expect(lte({ params: [-1, 0], location })).toBe(true);
  expect(lte({ params: [-1, 1], location })).toBe(true);
  expect(lte({ params: [0.1, 0.2], location })).toBe(true);
  expect(lte({ params: [null, 1], location })).toBe(true);
  expect(lte({ params: [null, null], location })).toBe(true);
  expect(lte({ params: [new Date(1), new Date(2)], location })).toBe(true);
  expect(lte({ params: [new Date(1), new Date(1)], location })).toBe(true);
  expect(lte({ params: [null, new Date(2)], location })).toBe(true);
  expect(lte({ params: [false, true], location })).toBe(true);
  expect(lte({ params: ['a', 'b'], location })).toBe(true);
  expect(lte({ params: ['aa', 'b'], location })).toBe(true);
  expect(lte({ params: ['b', 'bb'], location })).toBe(true);
  expect(lte({ params: ['b', 'b'], location })).toBe(true);
});

test('_lte param 0 greater than param 1', () => {
  expect(lte({ params: [1, 0], location })).toBe(false);
  expect(lte({ params: [0, -1], location })).toBe(false);
  expect(lte({ params: [1, -1], location })).toBe(false);
  expect(lte({ params: [0.2, 0.1], location })).toBe(false);
  expect(lte({ params: [1, null], location })).toBe(false);
  expect(lte({ params: [new Date(2), new Date(1)], location })).toBe(false);
  expect(lte({ params: [new Date(2), null], location })).toBe(false);
  expect(lte({ params: ['bbb', 'bb'], location })).toBe(false);
});

test('_lte params not an array', () => {
  expect(() => lte({ params: '1, 0', location })).toThrow(
    'Operator Error: _lte takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_lte params array with length 1', () => {
  expect(() => lte({ params: [1], location })).toThrow(
    'Operator Error: _lte takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_lte params array with length 3', () => {
  expect(() => lte({ params: [1, 2, 3], location })).toThrow(
    'Operator Error: _lte takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});
