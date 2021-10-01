import commonOperators from '../src/common';
import webOperators from '../src/web';

const operators = Object.keys({
  ...commonOperators,
  ...webOperators,
});

const lowdefy = {
  imports: {
    jsOperators: {},
    jsActions: {},
  },
  inputs: {
    context: {
      string: 'input',
      arr: [{ a: 'input1' }, { a: 'input2' }],
    },
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
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
  user: { name: 'user' },
};

const context = {
  id: 'context',
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  eventLog: [
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ],
  requests: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
    returnsNull: { loading: false, response: null },
  },
  lowdefy,
  state: {
    string: 'state',
    arr: [{ a: 'state1' }, { a: 'state2' }],
    number: 42,
    boolean: true,
  },
  operators,
};

export { context, operators };
