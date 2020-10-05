import intersect from '../src/intersect';

test('intersect', () => {
  expect(intersect(['0', '1'], ['0'])).toBe(true);
  expect(intersect(['0', '1'], ['3'])).toBe(false);
  expect(intersect(['1'], ['0', '2', '1'])).toBe(true);
  expect(intersect([], ['3'])).toBe(false);
  expect(intersect(['1'], [])).toBe(false);
  expect(intersect([], [])).toBe(false);
});
