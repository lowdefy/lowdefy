import gte from '../../src/common/gte';

test('_gte param 0 less than param 1', () => {
  expect(gte({ params: [1, 1], location: 'locationId' })).toBe(true);
  expect(gte({ params: [1, 0], location: 'locationId' })).toBe(true);
  expect(gte({ params: [0, -1], location: 'locationId' })).toBe(true);
  expect(gte({ params: [1, -1], location: 'locationId' })).toBe(true);
  expect(gte({ params: [0.2, 0.1], location: 'locationId' })).toBe(true);
});

test('_gte param 0 greater than param 1', () => {
  expect(gte({ params: [0, 1], location: 'locationId' })).toBe(false);
  expect(gte({ params: [-1, 0], location: 'locationId' })).toBe(false);
  expect(gte({ params: [-1, 1], location: 'locationId' })).toBe(false);
  expect(gte({ params: [0.1, 0.2], location: 'locationId' })).toBe(false);
});

test('_gte params not an array', () => {
  expect(() => gte({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _gte takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_gte params array with length 1', () => {
  expect(() => gte({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _gte takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_gte params array with length 3', () => {
  expect(() => gte({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _gte takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_gte params array with non numbers', () => {
  expect(() => gte({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _gte takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => gte({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _gte takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
