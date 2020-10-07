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

test('_nunjucks string template', () => {
  const input = { _nunjucks: 'String with {{ string }} embedded' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('String with state embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks null', () => {
  const input = { _nunjucks: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks { template: , on: }', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: { string: 'test' } },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('String with test embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks template not a string', () => {
  const input = { _nunjucks: ['String with {{ string }} embedded'] };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks params on template not a string', () => {
  const input = {
    _nunjucks: { template: ['String with {{ string }} embedded'], on: { string: 'test' } },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks on not a object', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: [{ string: 'test' }] },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks on null', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: null },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks invalid template', () => {
  const input = { _nunjucks: 'String with {{ string  embedded' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _nunjucks failed to parse nunjucks template. Received: "String with {{ string  embedded" at locationId.],
    ]
  `);
});
