import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
  boolean: true,
};
const user = { firstName: 'Name', number: 2 };
const args = {};

test('_type with on, pass', () => {
  const input = { _type: { type: 'string', on: 'a' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with on, fail', () => {
  const input = { _type: { type: 'number', on: 'b' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, pass', () => {
  const input = { _type: { type: 'string', key: 'string' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, fail', () => {
  const input = { _type: { type: 'number', key: 'string' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with null on pass', () => {
  const input = { _type: { type: 'null', on: null } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('_type with null on fail', () => {
  const input = { _type: { type: 'boolean', on: null } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', () => {
  const input = { _type: { type: 'string', key: 'notThere' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', () => {
  const input = { _type: { type: 'string', key: null } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type null', () => {
  const input = { _type: null };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _type.type must be a string. Received: null at locationId.],
    ]
  `);
});

test('_type with non-string on', () => {
  const input = { _type: { type: 'number', on: 5 } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with unknown type', () => {
  const input = { _type: 'strings', key: 'string' };
  const parser = new NodeParser({ state, user, arrayIndices: [] });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: "strings" is not a valid _type test. Received: "strings" at locationId.],
    ]
  `);
});

test('_type date with on packed date pass', () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new NodeParser({ state, user, arrayIndices: [] });
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on string date fail', () => {
  const input = { _type: { type: 'date', on: '2019-11-28T08:10:09.844Z' } };
  const parser = new NodeParser({ state, user, arrayIndices: [] });
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on date object pass', () => {
  const input = { _type: { type: 'date', on: new Date() } };
  const parser = new NodeParser({ state, user, arrayIndices: [] });
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
