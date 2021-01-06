import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const args = {};

test('_operator, _state', () => {
  const input = { a: { _operator: { name: '_state', params: 'string' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator.name invalid', () => {
  const input = { a: { _operator: { name: '_a' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator - Invalid operator name. Received: {"name":"_a"} at locationId.],
    ]
  `);
});

test('_operator.name not a string', () => {
  const input = { a: { _operator: { name: 1 } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: {"name":1} at locationId.],
    ]
  `);
});

test('_operator with value not a object', () => {
  const input = { a: { _operator: 'a' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: "a" at locationId.],
    ]
  `);
});

test('_operator cannot be set to _operator', () => {
  const input = { a: { _operator: { name: '_operator' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name cannot be set to _operator to infinite avoid loop reference. Received: {"name":"_operator"} at locationId.],
    ]
  `);
});

test('_operator, _not with no params', () => {
  const input = { a: { _operator: { name: '_not' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator, _json_parse with params', () => {
  const input = { a: { _operator: { name: '_json_parse', params: '[{ "a": "a1"}]' } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: [{ a: 'a1' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
