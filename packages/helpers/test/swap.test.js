import swap from '../src/swap';

test('swap', () => {
  const arr = [0, 1, 2, 3, 4];
  swap(arr, 2, 3);
  expect(arr).toEqual([0, 1, 3, 2, 4]);
});

test('swap out of bounds', () => {
  const arr = [0, 1, 2, 3, 4];
  swap(arr, -1, 3);
  expect(arr).toEqual(arr);
  swap(arr, 2, 8);
  expect(arr).toEqual(arr);
});

test('not an array', () => {
  const arr = 1;
  swap(arr, 2, 3);
  expect(arr).toEqual(1);
});
