/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

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
