import gutterSetup from '../src/gutterSetup';

test('no gutter specified', () => {
  expect(gutterSetup(undefined)).toEqual(undefined);
});

test('gutter is int', () => {
  expect(gutterSetup(10)).toEqual([10, 10]);
});

test('gutter is 0', () => {
  expect(gutterSetup(0)).toEqual([0, 0]);
});

test('gutter is array', () => {
  expect(gutterSetup([10, 20])).toEqual([10, 20]);
});

test('gutter is object', () => {
  expect(gutterSetup({ sm: 10, md: 20 }, null)).toEqual([
    { sm: 10, md: 20 },
    { sm: 10, md: 20 },
  ]);
});
