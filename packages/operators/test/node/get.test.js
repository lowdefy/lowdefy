/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const object = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const arr = [1, 2, 3];
const args = {};

test('_get in object', () => {
  const input = { a: { _get: { from: object, key: 'string' } } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

// test('_get replace key arrayIndices', () => {
//   const input = { a: { _get: { from: object, key: 'arr.$.a' } } };
//   const parser = new NodeParser({
//     arrayIndices: [1],
//   });
//   const res = parser.parse({ input, args, location: 'locationId' });
//   expect(res.output).toEqual({
//     a: 'a2',
//   });
//   expect(res.errors).toMatchInlineSnapshot(`Array []`);
// });

test('_get on array', () => {
  const input = { a: { _get: { from: arr, key: '0' } } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 1,
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_get null', () => {
  const input = { _get: null };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _get takes an object as params. Received: null at locationId.],
    ]
  `);
});

test('_get from: int', () => {
  const input = { _get: { from: 1, key: 'a' } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
});

test('_get from: null', () => {
  const input = { _get: { from: null, key: 'a' } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
});

test('_get key: int', () => {
  const input = { _get: { from: object, key: 1 } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _get.key takes a string. Received {"from":{"string":"Some String","number":42,"arr":[{"a":"a1"},{"a":"a2"}]},"key":1} at locationId.],
    ]
  `);
});
