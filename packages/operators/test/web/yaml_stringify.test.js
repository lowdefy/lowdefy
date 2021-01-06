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
};

const contexts = {};

const arrayIndices = [1];

test('_yaml_stringify string', () => {
  const input = { a: { _yaml_stringify: 'firstName' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `firstName
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify number', () => {
  const input = { a: { _yaml_stringify: 1 } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `1
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify boolean true', () => {
  const input = { a: { _yaml_stringify: true } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `true
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify boolean false', () => {
  const input = { a: { _yaml_stringify: false } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `false
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify null', () => {
  const input = { a: { _yaml_stringify: null } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `null
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify undefined in object', () => {
  const input = { a: { _yaml_stringify: { b: undefined } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `{}
`,
  });
  expect(res.errors).toEqual([]);
});

// This is unexpected but happens due to the way JSON stringify works
test('_yaml_stringify undefined ', () => {
  const input = { _yaml_stringify: undefined };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({}); // expected 'undefined' ?
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date', () => {
  const input = { _yaml_stringify: new Date(0) };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(`_date: '1970-01-01T00:00:00.000Z'
`);
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify array', () => {
  const input = { a: { _yaml_stringify: [{ a: 'a1' }, { a: 'a2' }] } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `- a: a1
- a: a2
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date in array', () => {
  const input = { a: { _yaml_stringify: [new Date(0), new Date(1)] } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `- _date: '1970-01-01T00:00:00.000Z'
- _date: '1970-01-01T00:00:00.001Z'
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date in object', () => {
  const input = { a: { _yaml_stringify: { a: new Date(0) } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: `a:
  _date: '1970-01-01T00:00:00.000Z'
`,
  });
  expect(res.errors).toEqual([]);
});
