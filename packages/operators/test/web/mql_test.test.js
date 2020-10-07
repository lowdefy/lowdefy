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
    number: 42,
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

test('_mql_test string equal', () => {
  const input = { _mql_test: { string: { $eq: 'state' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test string equal shorthand', () => {
  const input = { _mql_test: { string: 'state' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test string not equal', () => {
  const input = { _mql_test: { string: 'Not state' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number equal', () => {
  const input = { _mql_test: { number: { $eq: 42 } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number not equal', () => {
  const input = { _mql_test: { number: 'Some Other String' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test number greater than', () => {
  const input = { _mql_test: { number: { $gt: 1 } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test null', () => {
  const input = { _mql_test: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
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
      test: { string: 'user' },
      on: { _user: true },
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test invalid params', () => {
  const input = {
    _mql_test: {
      other: { string: 'user' },
      on: { _user: true },
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_mql_test invalid test', () => {
  const input = { _mql_test: { string: { $badOp: 'Some String' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _mql_test failed to execute MQL aggregation. Received: {"string":{"$badOp":"Some String"}} at locationId.],
    ]
  `);
});
