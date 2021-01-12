import base64 from '../../src/node/base64';

test('_base64.decode a string', () => {
  expect(
    base64({ params: ['QSBzdHJpbmcgdmFsdWU='], location: 'locationId', method: 'decode' })
  ).toEqual('A string value');
});

test('_base64.decode a number', () => {
  expect(() =>
    base64({ params: [10], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.decode - Input must be a string type. Received: {\\"_base64.decode\\":[10]} at locationId."`
  );
});

test('_base64.decode a boolean', () => {
  expect(() =>
    base64({ params: [true], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.decode - Input must be a string type. Received: {\\"_base64.decode\\":[true]} at locationId."`
  );
});

test('_base64.decode a object', () => {
  expect(() =>
    base64({ params: [{ a: 1 }], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.decode - Input must be a string type. Received: {\\"_base64.decode\\":[{\\"a\\":1}]} at locationId."`
  );
});

test('_base64.decode a array', () => {
  expect(() =>
    base64({ params: [['a', 'b']], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.decode - Input must be a string type. Received: {\\"_base64.decode\\":[[\\"a\\",\\"b\\"]]} at locationId."`
  );
});

test('_base64.decode undefined', () => {
  expect(() =>
    base64({ location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64 must be called with one of the following properties: ; or methods: encode, decode. Received: undefined at locationId."`
  );
});

test('_base64.decode null', () => {
  expect(() =>
    base64({ params: [null], location: 'locationId', method: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.decode - Input must be a string type. Received: {\\"_base64.decode\\":[null]} at locationId."`
  );
});

test('_base64.encode a string', () => {
  expect(base64({ params: ['A string value'], location: 'locationId', method: 'encode' })).toEqual(
    'QSBzdHJpbmcgdmFsdWU='
  );
});

test('_base64.encode a number', () => {
  expect(() =>
    base64({ params: [10], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.encode - Input must be a string type. Received: {\\"_base64.encode\\":[10]} at locationId."`
  );
});

test('_base64.encode a boolean', () => {
  expect(() =>
    base64({ params: [true], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.encode - Input must be a string type. Received: {\\"_base64.encode\\":[true]} at locationId."`
  );
});

test('_base64.encode a object', () => {
  expect(() =>
    base64({ params: [{ a: 1 }], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.encode - Input must be a string type. Received: {\\"_base64.encode\\":[{\\"a\\":1}]} at locationId."`
  );
});

test('_base64.encode a array', () => {
  expect(() =>
    base64({ params: [['a', 'b']], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.encode - Input must be a string type. Received: {\\"_base64.encode\\":[[\\"a\\",\\"b\\"]]} at locationId."`
  );
});

test('_base64.encode undefined', () => {
  expect(() =>
    base64({ location: ['locationId'], method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64 must be called with one of the following properties: ; or methods: encode, decode. Received: undefined at locationId."`
  );
});

test('_base64.encode null', () => {
  expect(() =>
    base64({ params: [null], location: 'locationId', method: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _base64.encode - Input must be a string type. Received: {\\"_base64.encode\\":[null]} at locationId."`
  );
});
