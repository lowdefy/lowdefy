import base64_decode from '../../src/web/base64_decode';

test('_base64_decode a string', () => {
  expect(base64_decode({ params: 'QSBzdHJpbmcgdmFsdWU=', location: 'locationId' })).toEqual(
    'A string value'
  );
});

test('_base64_decode a number', () => {
  expect(() => base64_decode({ params: 10, location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: 10 at locationId.'
  );
});

test('_base64_decode a boolean', () => {
  expect(() => base64_decode({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: true at locationId.'
  );
});

test('_base64_decode a object', () => {
  expect(() => base64_decode({ params: { a: 1 }, location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: {"a":1} at locationId.'
  );
});

test('_base64_decode a array', () => {
  expect(() => base64_decode({ params: ['a', 'b'], location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: ["a","b"] at locationId.'
  );
});

test('_base64_decode undefined', () => {
  expect(() => base64_decode({ location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: undefined at locationId.'
  );
});

test('_base64_decode null', () => {
  expect(() => base64_decode({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _base64_decode takes an string type as input. Received: null at locationId.'
  );
});
