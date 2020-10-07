/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_mql_aggregate sort', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $sort: {
            id: 1,
          },
        },
      ],
      on: [
        {
          id: 2,
        },
        {
          id: 1,
        },
      ],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual([
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_aggregate on is object', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $sort: {
            id: 1,
          },
        },
      ],
      on: {
        id: 1,
      },
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual([
    {
      id: 1,
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_aggregate group', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $group: {
            _id: 0,
            count: { $sum: 1 },
          },
        },
      ],
      on: [
        {
          id: 2,
        },
        {
          id: 1,
        },
      ],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual([
    {
      _id: 0,
      count: 2,
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_aggregate empty pipeline', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [],
      on: [
        {
          id: 2,
        },
        {
          id: 1,
        },
      ],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual([
    {
      id: 2,
    },
    {
      id: 1,
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_aggregate empty collection', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $sort: {
            id: 1,
          },
        },
      ],
      on: [],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual([]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_aggregate on is string', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $sort: {
            id: 1,
          },
        },
      ],
      on: 'invalid',
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_aggregate.on must be of type array or object. Received: {"pipeline":[{"$sort":{"id":1}}],"on":"invalid"} at locationId.],
    ]
  `);
});

test('_mql_aggregate invalid', () => {
  const input = {
    _mql_aggregate: {
      pipeline: [
        {
          $badOp: {
            id: 1,
          },
        },
      ],
      on: [
        {
          id: 2,
        },
        {
          id: 1,
        },
      ],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_aggregate failed to execute MQL aggregation. Received: {"pipeline":[{"$badOp":{"id":1}}],"on":[{"id":2},{"id":1}]} at locationId.],
    ]
  `);
});

test('_mql_aggregate pipeline not an array', () => {
  const input = {
    _mql_aggregate: {
      pipeline: 'invalid',
      on: [
        {
          id: 2,
        },
        {
          id: 1,
        },
      ],
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_aggregate.pipeline must be of type array. Received: {"pipeline":"invalid","on":[{"id":2},{"id":1}]} at locationId.],
    ]
  `);
});

test('_mql_aggregate params not object', () => {
  const input = {
    _mql_aggregate: [
      {
        $sort: {
          id: 1,
        },
      },
    ],
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_aggregate takes an object with a MQL expression. Received: [{"$sort":{"id":1}}] at locationId.],
    ]
  `);
});
