/* eslint-disable max-classes-per-file */
import WebParser from '../../src/webParser';

const context = {
  contextId: 'own',
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

const contexts = {
  own: context,

  c: { contextId: 'c' },
  a: { contextId: 'a' },
  b: { contextId: 'b' },
};

const arrayIndices = [1];

test('_list_contexts empty contexts', () => {
  const obj = { _list_contexts: true };
  const parser = new WebParser({ context, contexts: {} });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_list_contexts contexts exist, sorts list', () => {
  const obj = { _list_contexts: true };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input: obj, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(['a', 'b', 'c', 'own']);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
