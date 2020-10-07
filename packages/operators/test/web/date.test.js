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

test('_date now', () => {
  const RealDate = Date;
  const constantDate = new Date();
  global.Date = class extends Date {
    constructor() {
      super();
      return constantDate;
    }
  };
  const input = { _date: 'now' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(constantDate);
  global.Date = RealDate;
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date from string', () => {
  const input = { _date: '2018-01-01T12:00:00.000Z' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(new Date('2018-01-01T12:00:00.000Z'));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date short format', () => {
  const input = { _date: '2018-01-01' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(new Date('2018-01-01'));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date from unix timestamp', () => {
  const input = { _date: 1569579992 };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(new Date(1569579992));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date null', () => {
  const input = { _date: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: null at locationId.],
    ]
  `);
});

test('_date invalid operator', () => {
  const input = { _date: {} };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: {} at locationId.],
    ]
  `);
});

test('_date invalid string', () => {
  const input = { _date: 'abc' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date could not resolve as a valid javascript date. Received: "abc" at locationId.],
    ]
  `);
});

test('_date invalid float', () => {
  const input = { _date: 1.3 };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: 1.3 at locationId.],
    ]
  `);
});

test('_date negative int', () => {
  const input = { _date: -1000 };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(new Date(-1000));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
