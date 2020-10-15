/* eslint-disable max-classes-per-file */
import WebParser from '../../src/webParser';

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
};

const contexts = {};

const arrayIndices = [1];

test('_input in object', () => {
  const obj = { a: { _input: 'string' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'input',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input full input', () => {
  const obj = { _input: true };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    string: 'input',
    arr: [{ a: 'input1' }, { a: 'input2' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input array', () => {
  const obj = { _input: 'arr' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([{ a: 'input1' }, { a: 'input2' }]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input null', () => {
  const obj = { _input: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _input params must be of type string or object. Received: null at locationId.],
    ]
  `);
});

test('_input param object key', () => {
  const obj = {
    _input: {
      key: 'string',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('input');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object all', () => {
  const obj = {
    _input: {
      all: true,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    string: 'input',
    arr: [{ a: 'input1' }, { a: 'input2' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object all and key', () => {
  const obj = {
    _input: {
      all: true,
      key: 'string',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    string: 'input',
    arr: [{ a: 'input1' }, { a: 'input2' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object invalid', () => {
  const obj = {
    _input: {
      other: true,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _input.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_input param array', () => {
  const obj = {
    _input: ['string'],
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _input params must be of type string or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_input param object with string default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with zero default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with false default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with no default', () => {
  const obj = {
    _input: {
      key: 'notFound',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input replace key arrayIndices', () => {
  const obj = { a: { _input: 'arr.$.a' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'input2',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
