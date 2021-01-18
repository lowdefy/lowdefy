import product from '../../src/common/product';

test('_product number parameters', () => {
  expect(product({ params: [1, 3], location: 'locationId' })).toBe(3);
  expect(product({ params: [1, -1], location: 'locationId' })).toBe(-1);
  expect(product({ params: [1, 2, 3, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, 4.2, 5.123], location: 'locationId' })).toBe(129.0996);
});

test('_product ignores non number parameters', () => {
  expect(product({ params: [1, 2, 3, null, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, undefined, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, true, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, false, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, NaN, 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, 'a', 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, [], 4, 5], location: 'locationId' })).toBe(120);
  expect(product({ params: [1, 2, 3, {}, 4, 5], location: 'locationId' })).toBe(120);
});

test('_product invalid parameters', () => {
  expect(() => product({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _product takes an array type as input. Received: null at locationId.'
  );
  expect(() => product({ params: 'a', location: 'locationId' })).toThrow(
    'Operator Error: _product takes an array type as input. Received: "a" at locationId.'
  );
  expect(() => product({ params: false, location: 'locationId' })).toThrow(
    'Operator Error: _product takes an array type as input. Received: false at locationId.'
  );
});
