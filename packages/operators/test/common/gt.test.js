import gt from '../../src/common/gt';

test('_gt param 0 less than param 1', () => {
  expect(gt({ params: [1, 0], location: 'locationId' })).toBe(true);
  expect(gt({ params: [0, -1], location: 'locationId' })).toBe(true);
  expect(gt({ params: [1, -1], location: 'locationId' })).toBe(true);
  expect(gt({ params: [0.2, 0.1], location: 'locationId' })).toBe(true);
});

test('_gt param 0 greater than param 1', () => {
  expect(gt({ params: [1, 1], location: 'locationId' })).toBe(false);
  expect(gt({ params: [0, 1], location: 'locationId' })).toBe(false);
  expect(gt({ params: [-1, 0], location: 'locationId' })).toBe(false);
  expect(gt({ params: [-1, 1], location: 'locationId' })).toBe(false);
  expect(gt({ params: [0.1, 0.2], location: 'locationId' })).toBe(false);
});

test('_gt params not an array', () => {
  expect(() => gt({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _gt takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_gt params array with length 1', () => {
  expect(() => gt({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _gt takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_gt params array with length 3', () => {
  expect(() => gt({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _gt takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_gt params array with non numbers', () => {
  expect(() => gt({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _gt takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => gt({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _gt takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
