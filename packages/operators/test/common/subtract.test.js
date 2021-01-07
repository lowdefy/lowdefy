import subtract from '../../src/common/subtract';

test('_subtract param 0 greater than param 1', () => {
  expect(subtract({ params: [1, 1], location: 'locationId' })).toBe(0);
  expect(subtract({ params: [0, -1], location: 'locationId' })).toBe(1);
  expect(subtract({ params: [1, -1], location: 'locationId' })).toBe(2);
  expect(subtract({ params: [0.2, 0.1], location: 'locationId' })).toBe(0.1);
});

test('_subtract params not an array', () => {
  expect(() => subtract({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_subtract params array with length 1', () => {
  expect(() => subtract({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_subtract params array with length 3', () => {
  expect(() => subtract({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_subtract params array with non numbers', () => {
  expect(() => subtract({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => subtract({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
