import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
  booleanTrue: true,
  booleanFalse: false,
};

const args = {};

test('_mql_expr add number', () => {
  const input = { _mql_expr: { $add: ['$number', 2] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(44);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_expr null', () => {
  const input = { _mql_expr: null };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_expr takes an object with a MQL expression. Received: null at locationId.],
    ]
  `);
});

test('_mql_expr params on', () => {
  const input = {
    _mql_expr: {
      expr: { $add: ['$number', 2] },
      on: {
        number: 2,
      },
    },
  };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(4);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_expr invalid', () => {
  const input = { _mql_expr: { $cond: ['$number'] } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_expr failed to execute MQL expression. Received: {"$cond":["$number"]} at locationId.],
    ]
  `);
});

test('_mql_expr logic', () => {
  const parser = new NodeParser({ state });
  let input = {
    _mql_expr: { $and: [{ $gt: ['$number', 41] }, { _state: 'booleanTrue' }] },
  };
  let res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  input = {
    _mql_expr: { $and: [{ $gt: ['$number', 41] }, { _state: 'booleanFalse' }] },
  };
  res = res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  input = {
    _mql_expr: { $and: [{ $gt: ['$number', 42] }, { _state: 'booleanTrue' }] },
  };
  res = res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
