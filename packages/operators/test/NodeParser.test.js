/* eslint-disable max-classes-per-file */
import NodeParser from '../src/nodeParser';

const state = {
  string: 'Some String',
};
const args = {};

test('parse input undefined', () => {
  const parser = new NodeParser({ state });
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse object', () => {
  const input = { a: { _state: 'string' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'Some String' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('parse array', () => {
  const input = [{ _state: 'string' }];
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(['Some String']);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse string', () => {
  const input = 'string';
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe('string');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse number', () => {
  const input = 42;
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(42);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse true', () => {
  const input = true;
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse false', () => {
  const input = false;
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse null', () => {
  const input = null;
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse undefined', () => {
  const input = undefined;
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(undefined);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse args not an object', () => {
  const input = { _state: 'string' };
  const parser = new NodeParser({ state });
  expect(() => parser.parse({ input, args: 'String' })).toThrow(
    'Operator parser args must be a object.'
  );
});

test('parse location not a string', () => {
  const input = { _state: 'string' };
  const parser = new NodeParser({ state });
  expect(() => parser.parse({ input, location: true })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('parse js dates', () => {
  const input = { a: new Date(1), b: [new Date(2)] };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: new Date(1), b: [new Date(2)] });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse js dates, do not modify input', () => {
  const input = { a: new Date(1) };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(input).toEqual({ a: new Date(1) });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _base64_encode operator', () => {
  const input = { a: { _base64_encode: 'A string value' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'QSBzdHJpbmcgdmFsdWU=' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _base64_decode operator', () => {
  const input = { a: { _base64_decode: 'QSBzdHJpbmcgdmFsdWU=' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'A string value' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _uri_encode operator', () => {
  const input = { a: { _uri_encode: 'ABC abc 123' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'ABC%20abc%20123' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _uri_decode operator', () => {
  const input = { a: { _uri_decode: 'ABC%20abc%20123' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'ABC abc 123' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _lt operator', () => {
  const input = { a: { _lt: [4, 5] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _lte operator', () => {
  const input = { a: { _lte: [5, 5] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _gt operator', () => {
  const input = { a: { _gt: [5, 3] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _gte operator', () => {
  const input = { a: { _gte: [5, 5] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _if_none operator', () => {
  const input = { a: { _if_none: [null, 'default'] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'default' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _random operator', () => {
  const mathRandomFn = Math.random;
  Math.random = () => 0.5678;
  const input = { a: { _random: 'string' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'kfv9yqdp' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  Math.random = mathRandomFn;
});

test('parse _uuid operator', () => {
  const input = { a: { _uuid: true } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output.a.length).toEqual(36);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _math operator', () => {
  const input = { a: { '_math.min': [9, 4, 2] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 2 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _sum operator', () => {
  const input = { a: { _sum: [1, 1] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 2 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _product operator', () => {
  const input = { a: { _product: [2, -3] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: -6 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _subtract operator', () => {
  const input = { a: { _subtract: [2, -3] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 5 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _divide operator', () => {
  const input = { a: { _divide: [2, 4] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 0.5 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _array operator', () => {
  const input = { a: { '_array.length': [[2, 4]] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 2 });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _object operator', () => {
  const input = { a: { '_object.keys': [{ a: 1, b: 2 }] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: ['a', 'b'] });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse _string operator', () => {
  const input = { a: { '_string.concat': ['a new ', 'string'] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: 'a new string' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json.stringify then _json.parse', () => {
  const value = {
    a: [
      { b: 1, c: false, d: new Date(0) },
      { b: 2, c: true, d: new Date(1) },
    ],
    e: 'null',
    f: 'undefined',
    g: 0,
  };
  const input = { x: { '_json.parse': [{ '_json.stringify': [value] }] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ x: value });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_json.stringify then _json.parse date', () => {
  const value = new Date();
  const input = { '_json.parse': [{ '_json.stringify': [value] }] };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(value);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
