import uri from '../../src/common/uri';

test('_uri.decode strings', () => {
  expect(
    uri({ params: ['%3B%2C%2F%3F%3A%40%26%3D%2B%24'], location: 'locationId', method: 'decode' })
  ).toEqual(';,/?:@&=+$');
  expect(uri({ params: ["-_.!~*'()"], location: 'locationId', method: 'decode' })).toEqual(
    "-_.!~*'()"
  );
  expect(uri({ params: ['%23'], location: 'locationId', method: 'decode' })).toEqual('#');
  expect(uri({ params: ['ABC%20abc%20123'], location: 'locationId', method: 'decode' })).toEqual(
    'ABC abc 123'
  );
});

test('_uri.decode a number', () => {
  expect(() =>
    uri({ params: [10], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[10]} at locationId."`
  );
});

test('_uri.decode a boolean', () => {
  expect(() =>
    uri({ params: [true], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[true]} at locationId."`
  );
});

test('_uri.decode a object', () => {
  expect(() =>
    uri({ params: [{ a: 1 }], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[{\\"a\\":1}]} at locationId."`
  );
});

test('_uri.decode a array', () => {
  expect(() =>
    uri({ params: [['a', 'b']], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[[\\"a\\",\\"b\\"]]} at locationId."`
  );
});

test('_uri.decode undefined', () => {
  expect(() =>
    uri({ params: [undefined], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[null]} at locationId."`
  );
});

test('_uri.decode null', () => {
  expect(() =>
    uri({ params: [null], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.decode - Input must be a string type. Received: {\\"_uri.decode\\":[null]} at locationId."`
  );
});

test('_uri.encode strings', () => {
  expect(uri({ params: [';,/?:@&=+$'], location: 'locationId', method: 'encode' })).toEqual(
    '%3B%2C%2F%3F%3A%40%26%3D%2B%24'
  );
  expect(uri({ params: ["-_.!~*'()"], location: 'locationId', method: 'encode' })).toEqual(
    "-_.!~*'()"
  );
  expect(uri({ params: ['#'], location: 'locationId', method: 'encode' })).toEqual('%23');
  expect(uri({ params: ['ABC abc 123'], location: 'locationId', method: 'encode' })).toEqual(
    'ABC%20abc%20123'
  );
});

test('_uri.encode a number', () => {
  expect(() =>
    uri({ params: [10], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[10]} at locationId."`
  );
});

test('_uri.encode a boolean', () => {
  expect(() =>
    uri({ params: [true], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[true]} at locationId."`
  );
});

test('_uri.encode a object', () => {
  expect(() =>
    uri({ params: [{ a: 1 }], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[{\\"a\\":1}]} at locationId."`
  );
});

test('_uri.encode a array', () => {
  expect(() =>
    uri({ params: [['a', 'b']], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[[\\"a\\",\\"b\\"]]} at locationId."`
  );
});

test('_uri.encode undefined', () => {
  expect(() =>
    uri({ params: [undefined], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[null]} at locationId."`
  );
});

test('_uri.encode null', () => {
  expect(() =>
    uri({ params: [null], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _uri.encode - Input must be a string type. Received: {\\"_uri.encode\\":[null]} at locationId."`
  );
});
