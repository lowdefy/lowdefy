import omit from '../src/omit';

test('omit flat keys', () => {
  const obj = { a: 1, b: 2, c: 3, d: 4 };
  omit(obj, ['a', 'd']);
  expect(obj).toEqual({ b: 2, c: 3 });
});

test('omit nest keys', () => {
  const obj = { a: 1, x: { b: 2, c: 3 }, d: 4 };
  omit(obj, ['a', 'x.c']);
  expect(obj).toEqual({ x: { b: 2 }, d: 4 });
});

// TODO: decide how arrays should be handled as this is how delete handles arrays.
test('omit array keys', () => {
  const obj = { a: [1, 2, 3, 4], b: 1, d: 4 };
  omit(obj, ['d', 'a.2']);
  expect(obj).toEqual({ a: [1, 2, undefined, 4], b: 1 });
});
