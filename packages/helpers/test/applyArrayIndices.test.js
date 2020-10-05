import applyArrayIndices from '../src/applyArrayIndices';

test('no arrayIndices', () => {
  expect(applyArrayIndices(undefined, 'a')).toEqual('a');
});

test('no arrayIndices 1', () => {
  expect(applyArrayIndices([], 'ab')).toEqual('ab');
});

test('no arrayIndices 2', () => {
  expect(applyArrayIndices([], 'a.b')).toEqual('a.b');
});

test('arrayIndices with 1 index, primitive', () => {
  expect(applyArrayIndices([1], 'a.$')).toEqual('a.1');
});

test('arrayIndices with 1 index, object', () => {
  expect(applyArrayIndices([1], 'a.$.b')).toEqual('a.1.b');
});

test('arrayIndices with 1 index, no $', () => {
  expect(applyArrayIndices([1], 'a')).toEqual('a');
});

test('arrayIndices with 2 indices', () => {
  expect(applyArrayIndices([1, 2], 'a.$.$.b')).toEqual('a.1.2.b');
});

test('arrayIndices with 2 indices, no $', () => {
  expect(applyArrayIndices([1, 2], 'a')).toEqual('a');
});

test('arrayIndices with 2 indices, 1 $', () => {
  expect(applyArrayIndices([1, 2], 'a.$.b')).toEqual('a.1.b');
});

test('arrayIndices with 1 index, more than 1 $', () => {
  expect(applyArrayIndices([1], 'a.$.a.$.b')).toEqual('a.1.a.$.b');
});

test('does not modify arrayIndices', () => {
  const arrayIndices = [1];
  expect(applyArrayIndices(arrayIndices, 'a.$')).toEqual('a.1');
  expect(arrayIndices).toEqual([1]);
});
