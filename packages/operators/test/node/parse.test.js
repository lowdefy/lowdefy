import NodeParser from '../../src/nodeParser';

const state = {};
const args = {};

test('_parse string unquoted', () => {
  const input = { a: { _parse: 'firstName' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _parse - Unexpected token i in JSON at position 1 Received: "firstName" at locationId.],
    ]
  `);
});

test('_parse string quoted', () => {
  const input = { a: { _parse: '"firstName"' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'firstName',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse number', () => {
  const input = { a: { _parse: '1' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 1,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse boolean true', () => {
  const input = { a: { _parse: 'true' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: true,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse boolean false', () => {
  const input = { a: { _parse: 'false' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: false,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse null', () => {
  const input = { a: { _parse: 'null' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse undefined string', () => {
  const input = { a: { _parse: 'undefined' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: undefined,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse object not allowed', () => {
  const input = { a: { _parse: { b: 'm' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _parse takes a string as input. Received: {"b":"m"} at locationId.],
    ]
  `);
});

test('_parse date not supported', () => {
  const input = { a: { _parse: new Date(0) } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _parse takes a string as input. Received: "1970-01-01T00:00:00.000Z" at locationId.],
    ]
  `);
});

test('_parse array', () => {
  const input = { a: { _parse: '[{ "a": "a1"},{ "a": "a2"}]' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: [{ a: 'a1' }, { a: 'a2' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse date array', () => {
  const input = {
    a: {
      _parse: '[{ "_date": "1970-01-01T00:00:00.000Z"},{ "_date": "1970-01-01T00:00:00.001Z"}]',
    },
  };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: [new Date(0), new Date(1)],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_parse date as object', () => {
  const input = { a: { _parse: '{ "_date": "1970-01-01T00:00:00.000Z"}' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: new Date(0) });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify then _parse', () => {
  const value = {
    a: [
      { b: 1, c: false, d: new Date(0) },
      { b: 2, c: true, d: new Date(1) },
    ],
    e: 'null',
    f: 'undefined',
    g: 0,
  };
  const input = { x: { _parse: { _stringify: value } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ x: value });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify then _parse date', () => {
  const value = new Date();
  const input = { _parse: { _stringify: value } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(value);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
