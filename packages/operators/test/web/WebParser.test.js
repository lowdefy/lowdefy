/* eslint-disable max-classes-per-file */
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

test('parse input undefined', () => {
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse object', () => {
  const input = { a: { _state: 'string' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: 'state' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('parse array', () => {
  const input = [{ _state: 'string' }];
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(['state']);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse string', () => {
  const input = 'string';
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe('string');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse number', () => {
  const input = 42;
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(42);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse true', () => {
  const input = true;
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse false', () => {
  const input = false;
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse null', () => {
  const input = null;
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse undefined', () => {
  const input = undefined;
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(undefined);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse args not an object', () => {
  const input = { _state: 'string' };
  const parser = new WebParser({ context, contexts });
  expect(() => parser.parse({ input, args: 'String' })).toThrow(
    'Operator parser args must be a object.'
  );
});

test('parse location not a string', () => {
  const input = { _state: 'string' };
  const parser = new WebParser({ context, contexts });
  expect(() => parser.parse({ input, location: true })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('parse js dates', () => {
  const input = { a: new Date(1), b: [new Date(2)] };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: new Date(1), b: [new Date(2)] });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse js dates, do not modify input', () => {
  const input = { a: new Date(1) };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(input).toEqual({ a: new Date(1) });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse location not specified', () => {
  const input = { _state: 'string' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, arrayIndices });
  expect(res.output).toEqual('state');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _base64_encode operator', () => {
  const input = { a: { _base64_encode: 'A string value' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'QSBzdHJpbmcgdmFsdWU=' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _base64_decode operator', () => {
  const input = { a: { _base64_decode: 'QSBzdHJpbmcgdmFsdWU=' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'A string value' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_uri_encode strings', () => {
  const input = { a: { _uri_encode: 'ABC abc 123' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'ABC%20abc%20123' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_uri_decode strings', () => {
  const input = { a: { _uri_decode: 'ABC%20abc%20123' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'ABC abc 123' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
