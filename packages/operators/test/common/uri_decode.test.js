import uri_decode from '../../src/common/uri_decode';

test('_uri_decode strings', () => {
  expect(uri_decode({ params: '%3B%2C%2F%3F%3A%40%26%3D%2B%24', location: 'locationId' })).toEqual(
    ';,/?:@&=+$'
  );
  expect(uri_decode({ params: "-_.!~*'()", location: 'locationId' })).toEqual("-_.!~*'()");
  expect(uri_decode({ params: '%23', location: 'locationId' })).toEqual('#');
  expect(uri_decode({ params: 'ABC%20abc%20123', location: 'locationId' })).toEqual('ABC abc 123');
});

test('_uri_decode a number', () => {
  expect(() => uri_decode({ params: 10, location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: 10 at locationId.'
  );
});

test('_uri_decode a boolean', () => {
  expect(() => uri_decode({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: true at locationId.'
  );
});

test('_uri_decode a object', () => {
  expect(() => uri_decode({ params: { a: 1 }, location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: {"a":1} at locationId.'
  );
});

test('_uri_decode a array', () => {
  expect(() => uri_decode({ params: ['a', 'b'], location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: ["a","b"] at locationId.'
  );
});

test('_uri_decode undefined', () => {
  expect(() => uri_decode({ location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: undefined at locationId.'
  );
});

test('_uri_decode null', () => {
  expect(() => uri_decode({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _uri_decode takes an string type as input. Received: null at locationId.'
  );
});
