import if_none from '../../src/common/if_none';

test('_if_none evaluates true for null and undefined', () => {
  expect(if_none({ params: [null, 'default'], location: 'locationId' })).toEqual('default');
  expect(if_none({ params: [undefined, 'default'], location: 'locationId' })).toEqual('default');
});

test('_if_none evaluates false for everything else', () => {
  expect(if_none({ params: [1, 'default'], location: 'locationId' })).toEqual(1);
  expect(if_none({ params: [0, 'default'], location: 'locationId' })).toEqual(0);
  expect(if_none({ params: [[], 'default'], location: 'locationId' })).toEqual([]);
  expect(if_none({ params: [{}, 'default'], location: 'locationId' })).toEqual({});
  expect(if_none({ params: ['', 'default'], location: 'locationId' })).toEqual('');
  expect(if_none({ params: [true, 'default'], location: 'locationId' })).toEqual(true);
  expect(if_none({ params: [false, 'default'], location: 'locationId' })).toEqual(false);
});

test('_if_none params not an array', () => {
  expect(() => if_none({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _if_none takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_if_none params array with length 1', () => {
  expect(() => if_none({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _if_none takes an array of length 2 as input. Received: [1] at locationId.'
  );
});
