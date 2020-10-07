import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_nunjucks string template', () => {
  const input = { _nunjucks: 'String with {{ string }} embedded' };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('String with Some String embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks null', () => {
  const input = { _nunjucks: null };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks { template: , on: }', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: { string: 'test' } },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('String with test embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks template not a string', () => {
  const input = { _nunjucks: ['String with {{ string }} embedded'] };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks params on template not a string', () => {
  const input = {
    _nunjucks: { template: ['String with {{ string }} embedded'], on: { string: 'test' } },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks on not a object', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: [{ string: 'test' }] },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks on null', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: null },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_nunjucks invalid template', () => {
  const input = { _nunjucks: 'String with {{ string  embedded' };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _nunjucks failed to parse nunjucks template. Received: "String with {{ string  embedded" at locationId.],
    ]
  `);
});
