import lt from '../../src/common/lt';

test('_lt param 0 less than param 1', () => {
  expect(lt({ params: [0, 1], location: 'locationId' })).toBe(true);
  expect(lt({ params: [-1, 0], location: 'locationId' })).toBe(true);
  expect(lt({ params: [-1, 1], location: 'locationId' })).toBe(true);
  expect(lt({ params: [0.1, 0.2], location: 'locationId' })).toBe(true);
});

test('_lt param 0 greater than param 1', () => {
  expect(lt({ params: [1, 1], location: 'locationId' })).toBe(false);
  expect(lt({ params: [1, 0], location: 'locationId' })).toBe(false);
  expect(lt({ params: [0, -1], location: 'locationId' })).toBe(false);
  expect(lt({ params: [1, -1], location: 'locationId' })).toBe(false);
  expect(lt({ params: [0.2, 0.1], location: 'locationId' })).toBe(false);
});

test('_lt params not an array', () => {
  expect(() => lt({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _lt takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_lt params array with length 1', () => {
  expect(() => lt({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _lt takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_lt params array with length 3', () => {
  expect(() => lt({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _lt takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_lt params array with non numbers', () => {
  expect(() => lt({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _lt takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => lt({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _lt takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
