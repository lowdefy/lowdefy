import string from '../../src/common/string';

test('_string valid methods', () => {
  expect(
    string({ params: ['A example string', 2], method: 'charAt', location: 'locationId' })
  ).toEqual('e');
  expect(
    string({ params: ['A example string', 2], method: 'charCodeAt', location: 'locationId' })
  ).toEqual(101);
  expect(
    string({ params: ['A example string', ' - result'], method: 'concat', location: 'locationId' })
  ).toEqual('A example string - result');
  expect(
    string({ params: ['A example string', 'ing'], method: 'endsWith', location: 'locationId' })
  ).toEqual(true);
  expect(
    string({ params: ['A example string', 'ex'], method: 'includes', location: 'locationId' })
  ).toEqual(true);
  expect(
    string({ params: ['A example string', 'ex'], method: 'indexOf', location: 'locationId' })
  ).toEqual(2);
  expect(
    string({ params: ['A example string', 'e'], method: 'lastIndexOf', location: 'locationId' })
  ).toEqual(8);
  expect(
    string({
      params: ['A example string', 'A example string'],
      method: 'localeCompare',
      location: 'locationId',
    })
  ).toEqual(0);
  expect(
    JSON.stringify(
      string({
        params: ['A example string of a string', 'string'],
        method: 'match',
        location: 'locationId',
      })
    )
  ).toEqual('["string"]');
  expect(
    string({
      params: ['A example string of a string', '/string/g'], // consider a regex implementation
      method: 'match',
      location: 'locationId',
    })
  ).toEqual(null);
  expect(
    string({
      params: ['\u0041\u006d\u00e9\u006c\u0069\u0065'],
      method: 'normalize',
      location: 'locationId',
    })
  ).toEqual('Amélie');
  expect(
    string({ params: ['A example string', 24, '.'], method: 'padEnd', location: 'locationId' })
  ).toEqual('A example string........');
  expect(
    string({ params: ['A example string', 24, '.'], method: 'padStart', location: 'locationId' })
  ).toEqual('........A example string');
  expect(
    string({ params: ['A example string', 3], method: 'repeat', location: 'locationId' })
  ).toEqual('A example stringA example stringA example string');
  expect(
    string({
      params: ['A example string', 'exam', 'EX'],
      method: 'replace',
      location: 'locationId',
    })
  ).toEqual('A EXple string');
  expect(
    string({
      params: ['A example string of strings', 'string'],
      method: 'search',
      location: 'locationId',
    })
  ).toEqual(10);
  expect(
    string({
      params: ['A example string of strings', '/string/g'],
      method: 'search',
      location: 'locationId',
    })
  ).toEqual(-1); // consider a regex implementation
  expect(
    string({ params: ['A example string', 3, 6], method: 'slice', location: 'locationId' })
  ).toEqual('xam');
  expect(
    string({ params: ['A example string', 'p'], method: 'split', location: 'locationId' })
  ).toEqual(['A exam', 'le string']);
  expect(
    string({ params: ['A example string', 'A e'], method: 'startsWith', location: 'locationId' })
  ).toEqual(true);
  expect(
    string({ params: ['A example string', 5], method: 'substring', location: 'locationId' })
  ).toEqual('mple string');
  expect(
    string({ params: ['İstanbul', 'en-US'], method: 'toLocaleLowerCase', location: 'locationId' })
  ).toEqual('i̇stanbul');
  expect(
    string({ params: ['istanbul', 'TR'], method: 'toLocaleUpperCase', location: 'locationId' })
  ).toEqual('İSTANBUL');
  expect(
    string({ params: ['A examplE String', 5], method: 'toLocaleLowerCase', location: 'locationId' })
  ).toEqual('a example string');
  expect(
    string({ params: ['A examplE String', 5], method: 'toUpperCase', location: 'locationId' })
  ).toEqual('A EXAMPLE STRING');
  expect(
    string({ params: ['    A example string    ', 5], method: 'trim', location: 'locationId' })
  ).toEqual('A example string');
  expect(
    string({ params: ['    A example string    ', 5], method: 'trimEnd', location: 'locationId' })
  ).toEqual('    A example string');
  expect(
    string({ params: ['    A example string    ', 5], method: 'trimStart', location: 'locationId' })
  ).toEqual('A example string    ');
});

test('_string valid properties', () => {
  expect(
    string({ params: ['A example string'], method: 'length', location: 'locationId' })
  ).toEqual(16);
});

test('_string called with no method or params', () => {
  expect(() => string({ location: 'locationId' })).toThrow(
    'Operator Error: _string takes an array with the first argument as a string on which to evaluate "undefined". Received: {"_string.undefined":undefined} at locationId.'
  );
});

test('_string invalid method', () => {
  expect(() => string({ params: ['a'], method: 'X', location: 'locationId' })).toThrow(
    'Operator Error: _string must be called with one of the following properties: length; or methods: charAt, charCodeAt, concat, endsWith, includes, indexOf, lastIndexOf, localeCompare, match, normalize, padEnd, padStart, repeat, replace, search, slice, split, startsWith, substring, toLocaleLowerCase, toLocaleUpperCase, toLowerCase, toUpperCase, trim, trimEnd, trimStart. Received: {"_string.X":["a"]} at locationId.'
  );
});

test('_string invalid method args', () => {
  expect(() => string({ params: 'X', method: 'flat', location: 'locationId' })).toThrow(
    'Operator Error: _string takes an array with the first argument as a string on which to evaluate "flat". Received: {"_string.flat":"X"} at locationId.'
  );
});
