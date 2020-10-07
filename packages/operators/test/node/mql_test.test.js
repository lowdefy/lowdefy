import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_mql_test string equal', () => {
  const input = { _mql_test: { string: { $eq: 'Some String' } } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test string equal shorthand', () => {
  const input = { _mql_test: { string: 'Some String' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test string not equal', () => {
  const input = { _mql_test: { string: 'Some Other String' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number equal', () => {
  const input = { _mql_test: { number: { $eq: 42 } } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number not equal', () => {
  const input = { _mql_test: { number: 'Some Other String' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number greater than', () => {
  const input = { _mql_test: { number: { $gt: 1 } } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test null', () => {
  const input = { _mql_test: null };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_test takes an object with a MQL expression. Received: null at locationId.],
    ]
  `);
});

test('_mql_test object params', () => {
  const input = {
    _mql_test: {
      test: { firstName: 'Name' },
      on: { _user: true },
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test invalid params', () => {
  const input = {
    _mql_test: {
      other: { firstName: 'Name' },
      on: { _user: true },
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test invalid test', () => {
  const input = { _mql_test: { string: { $badOp: 'Some String' } } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_test failed to execute MQL aggregation. Received: {"string":{"$badOp":"Some String"}} at locationId.],
    ]
  `);
});
