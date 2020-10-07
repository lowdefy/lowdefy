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
  user: {
    string: 'user',
    arr: [{ a: 'user1' }, { a: 'user2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_aggregate takes an object with a MQL expression. Received: [{"$sort":{"id":1}}] at locationId.],
    ]
  `);
});
