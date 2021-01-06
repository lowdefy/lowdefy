import base64_encode from '../../src/web/base64_encode';

test('_base64_encode a string', () => {
  expect(base64_encode({ params: 'A string value', location: 'locationId' })).toEqual(
    'QSBzdHJpbmcgdmFsdWU='
  );
});

test('_base64_encode a number', () => {
  expect(() => base64_encode({ params: 10, location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: 10 at locationId.'
  );
});

test('_base64_encode a boolean', () => {
  expect(() => base64_encode({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: true at locationId.'
  );
});

test('_base64_encode a object', () => {
  expect(() => base64_encode({ params: { a: 1 }, location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: {"a":1} at locationId.'
  );
});

test('_base64_encode a array', () => {
  expect(() => base64_encode({ params: ['a', 'b'], location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: ["a","b"] at locationId.'
  );
});

test('_base64_encode undefined', () => {
  expect(() => base64_encode({ location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: undefined at locationId.'
  );
});

test('_base64_encode null', () => {
  expect(() => base64_encode({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _base64_encode takes an string type as input. Received: null at locationId.'
  );
});
