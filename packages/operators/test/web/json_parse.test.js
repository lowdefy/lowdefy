import WebParser from '../../src/webParser';

const args = {
  string: 'args',
  arr: [{ a: 'args1' }, { a: 'args2' }],
};

const context = {
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  input: {
    string: 'input',
    arr: [{ a: 'input1' }, { a: 'input2' }],
  },
  lowdefyGlobal: {
    string: 'global',
    arr: [{ a: 'global1' }, { a: 'global2' }],
  },
  menus: [
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ],
  mutations: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'mutation String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'mutation a1' }, { a: 'mutation a2' }] },
  },
  requests: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
  },
  state: {
    string: 'state',
    arr: [{ a: 'state1' }, { a: 'state2' }],
  },
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

test('_json_parse string unquoted', () => {
  const input = { a: { _json_parse: 'firstName' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _json_parse - Unexpected token i in JSON at position 1 Received: "firstName" at locationId.],
    ]
  `);
});

test('_json_parse string quoted', () => {
  const input = { a: { _json_parse: '"firstName"' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'firstName',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse number', () => {
  const input = { a: { _json_parse: '1' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 1,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse boolean true', () => {
  const input = { a: { _json_parse: 'true' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: true,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse boolean false', () => {
  const input = { a: { _json_parse: 'false' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: false,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse null', () => {
  const input = { a: { _json_parse: 'null' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse undefined string', () => {
  const input = { a: { _json_parse: 'undefined' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: undefined,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse object not allowed', () => {
  const input = { a: { _json_parse: { b: 'm' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _json_parse takes a string as input. Received: {"b":"m"} at locationId.],
    ]
  `);
});

test('_json_parse date not supported', () => {
  const input = { a: { _json_parse: new Date(0) } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: null,
  });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _json_parse takes a string as input. Received: "1970-01-01T00:00:00.000Z" at locationId.],
    ]
  `);
});

test('_json_parse array', () => {
  const input = { a: { _json_parse: '[{ "a": "a1"},{ "a": "a2"}]' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: [{ a: 'a1' }, { a: 'a2' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse date array', () => {
  const input = {
    a: {
      _json_parse:
        '[{ "_date": "1970-01-01T00:00:00.000Z"},{ "_date": "1970-01-01T00:00:00.001Z"}]',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: [new Date(0), new Date(1)],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse date as object', () => {
  const input = { a: { _json_parse: '{ "_date": "1970-01-01T00:00:00.000Z"}' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: new Date(0) });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_parse date in object', () => {
  const input = { a: { _json_parse: '{"a": { "_date": "1970-01-01T00:00:00.000Z"} }' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: { a: new Date(0) } });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_stringify then _json_parse', () => {
  const value = {
    a: [
      { b: 1, c: false, d: new Date(0) },
      { b: 2, c: true, d: new Date(1) },
    ],
    e: 'null',
    f: 'undefined',
    g: 0,
  };
  const input = { x: { _json_parse: { _json_stringify: value } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ x: value });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json_stringify then _json_parse date', () => {
  const value = new Date();
  const input = { _json_parse: { _json_stringify: value } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(value);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
