import keyPermutations from '../src/keyPermutations';

test('no permutations on plain field names', () => {
  expect(keyPermutations('a')).toEqual(['a']);
  expect(keyPermutations('asdf')).toEqual(['asdf']);
  expect(keyPermutations('asdf123')).toEqual(['asdf123']);
  expect(keyPermutations('asdf123_sdf')).toEqual(['asdf123_sdf']);
});

test('no permutations on object field names', () => {
  expect(keyPermutations('a.b')).toEqual(['a.b']);
  expect(keyPermutations('asd.f')).toEqual(['asd.f']);
  expect(keyPermutations('asd.f1.a23')).toEqual(['asd.f1.a23']);
  expect(keyPermutations('asdf._d123._sd.f')).toEqual(['asdf._d123._sd.f']);
});

test('permutations on arrays field names', () => {
  expect(keyPermutations('a.0.b')).toEqual(['a.0.b', 'a.$.b']);
  expect(keyPermutations('a.0')).toEqual(['a.0', 'a.$']);
  expect(keyPermutations('a.0.b.0')).toEqual(['a.0.b.0', 'a.0.b.$', 'a.$.b.0', 'a.$.b.$']);
  expect(keyPermutations('a.0.b.0.c')).toEqual([
    'a.0.b.0.c',
    'a.0.b.$.c',
    'a.$.b.0.c',
    'a.$.b.$.c',
  ]);
  expect(keyPermutations('a.0.0.0')).toEqual([
    'a.0.0.0',
    'a.0.0.$',
    'a.0.$.0',
    'a.0.$.$',
    'a.$.0.0',
    'a.$.0.$',
    'a.$.$.0',
    'a.$.$.$',
  ]);
});
