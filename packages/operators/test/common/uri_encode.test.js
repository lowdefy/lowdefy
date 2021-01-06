import uri_encode from '../../src/common/uri_encode';

test('_uri_encode strings', () => {
  expect(uri_encode({ params: ';,/?:@&=+$', location: 'locationId' })).toEqual(
    '%3B%2C%2F%3F%3A%40%26%3D%2B%24'
  );
  expect(uri_encode({ params: "-_.!~*'()", location: 'locationId' })).toEqual("-_.!~*'()");
  expect(uri_encode({ params: '#', location: 'locationId' })).toEqual('%23');
  expect(uri_encode({ params: 'ABC abc 123', location: 'locationId' })).toEqual('ABC%20abc%20123');
});

test('_uri_encode a number', () => {
  expect(() => uri_encode({ params: 10, location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: 10 at locationId.'
  );
});

test('_uri_encode a boolean', () => {
  expect(() => uri_encode({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: true at locationId.'
  );
});

test('_uri_encode a object', () => {
  expect(() => uri_encode({ params: { a: 1 }, location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: {"a":1} at locationId.'
  );
});

test('_uri_encode a array', () => {
  expect(() => uri_encode({ params: ['a', 'b'], location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: ["a","b"] at locationId.'
  );
});

test('_uri_encode undefined', () => {
  expect(() => uri_encode({ location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: undefined at locationId.'
  );
});

test('_uri_encode null', () => {
  expect(() => uri_encode({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _uri_encode takes an string type as input. Received: null at locationId.'
  );
});
