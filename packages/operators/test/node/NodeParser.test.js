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
