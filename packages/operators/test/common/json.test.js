import json from '../../src/common/json';

test('_json.parse string unquoted', () => {
  expect(() =>
    json({ params: ['firstName'], location: 'locationId', method: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _json.parse - Unexpected token i in JSON at position 1 Received: {\\"_json.parse\\":[\\"firstName\\"]} at locationId."`
  );
});

test('_json.parse string quoted', () => {
  expect(json({ params: ['"firstName"'], location: 'locationId', method: 'parse' })).toEqual(
    'firstName'
  );
});

test('_json.parse number', () => {
  expect(json({ params: ['1'], location: 'locationId', method: 'parse' })).toEqual(1);
});

test('_json.parse boolean true', () => {
  expect(json({ params: ['true'], location: 'locationId', method: 'parse' })).toEqual(true);
});

test('_json.parse boolean false', () => {
  expect(json({ params: ['false'], location: 'locationId', method: 'parse' })).toEqual(false);
});

test('_json.parse null', () => {
  expect(json({ params: ['null'], location: 'locationId', method: 'parse' })).toEqual(null);
});

test('_json.parse undefined string', () => {
  expect(json({ params: ['undefined'], location: 'locationId', method: 'parse' })).toEqual(
    undefined
  );
});

test('_json.parse object not allowed', () => {
  expect(() =>
    json({ params: [{ b: 'm' }], location: 'locationId', method: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _json.parse - Input must be a string type. Received: {\\"_json.parse\\":[{\\"b\\":\\"m\\"}]} at locationId."`
  );
});

test('_json.parse date not supported', () => {
  expect(() =>
    json({ params: [new Date(0)], location: 'locationId', method: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _json.parse - Input must be a string type. Received: {\\"_json.parse\\":[\\"1970-01-01T00:00:00.000Z\\"]} at locationId."`
  );
});

test('_json.parse array', () => {
  expect(
    json({ params: ['[{ "a": "a1"},{ "a": "a2"}]'], location: 'locationId', method: 'parse' })
  ).toEqual([{ a: 'a1' }, { a: 'a2' }]);
});

test('_json.parse date array', () => {
  expect(
    json({
      params: ['[{ "_date": "1970-01-01T00:00:00.000Z"},{ "_date": "1970-01-01T00:00:00.001Z"}]'],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual([new Date(0), new Date(1)]);
});

test('_json.parse date as object', () => {
  expect(
    json({
      params: ['{ "_date": "1970-01-01T00:00:00.000Z"}'],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual(new Date(0));
});

test('_json.parse date in object', () => {
  expect(
    json({
      params: ['{"a": { "_date": "1970-01-01T00:00:00.000Z"} }'],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual({ a: new Date(0) });
});

test('_json.stringify string', () => {
  expect(json({ params: ['firstName'], location: 'locationId', method: 'stringify' })).toEqual(
    '"firstName"'
  );
});

test('_json.stringify number', () => {
  expect(json({ params: [1], location: 'locationId', method: 'stringify' })).toEqual('1');
});

test('_json.stringify boolean true', () => {
  expect(json({ params: [true], location: 'locationId', method: 'stringify' })).toEqual('true');
});

test('_json.stringify boolean false', () => {
  expect(json({ params: [false], location: 'locationId', method: 'stringify' })).toEqual('false');
});

test('_json.stringify null', () => {
  expect(json({ params: [null], location: 'locationId', method: 'stringify' })).toEqual('null');
});

test('_json.stringify undefined in object', () => {
  expect(json({ params: [{ b: undefined }], location: 'locationId', method: 'stringify' })).toEqual(
    '{}'
  );
});

// This is unexpected but happens due to the way JSON stringify works
test('_json.stringify undefined', () => {
  expect(json({ params: [undefined], location: 'locationId', method: 'stringify' })).toEqual(); // expected 'undefined' ?
});

test('_json.stringify date', () => {
  expect(json({ params: [new Date(0)], location: 'locationId', method: 'stringify' })).toEqual(
    '{ "_date": "1970-01-01T00:00:00.000Z" }'
  );
});

test('_json.stringify array', () => {
  expect(
    json({ params: [[{ a: 'a1' }, { a: 'a2' }]], location: 'locationId', method: 'stringify' })
  ).toMatchInlineSnapshot(`
    "[
      {
        \\"a\\": \\"a1\\"
      },
      {
        \\"a\\": \\"a2\\"
      }
    ]"
  `);
});

test('_json.stringify date array', () => {
  expect(
    json({ params: [[new Date(0), new Date(1)]], location: 'locationId', method: 'stringify' })
  ).toMatchInlineSnapshot(`
    "[
      {
        \\"_date\\": \\"1970-01-01T00:00:00.000Z\\"
      },
      {
        \\"_date\\": \\"1970-01-01T00:00:00.001Z\\"
      }
    ]"
  `);
});

test('_json.stringify date object', () => {
  expect(json({ params: [{ a: new Date(0) }], location: 'locationId', method: 'stringify' }))
    .toMatchInlineSnapshot(`
    "{
      \\"a\\": {
        \\"_date\\": \\"1970-01-01T00:00:00.000Z\\"
      }
    }"
  `);
});
