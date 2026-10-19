/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import compileParseTree from './compileParseTree.js';

const evaluation = { reviveKey: (value) => value };

test('compileParseTree returns a function that builds a fresh copy on every call', () => {
  const input = { a: [1, { b: 'x' }], c: null };
  const tree = compileParseTree(input);
  const first = tree(evaluation);
  const second = tree(evaluation);
  expect(first).toEqual(input);
  expect(first).not.toBe(input);
  expect(first.a).not.toBe(second.a);
  expect(first.a[1]).not.toBe(input.a[1]);
});

test('compileParseTree passes only single-key objects to reviveKey', () => {
  const seen = [];
  const tree = compileParseTree({ one: { _op: 1 }, two: { a: 1, b: 2 }, empty: {} });
  tree({
    reviveKey: (value, key) => {
      seen.push(key);
      return value;
    },
  });
  expect(seen).toEqual(['_op']);
});

test('compileParseTree returns null for values the JSON round trip would change', () => {
  [
    { fn: () => 1 },
    { value: undefined },
    [1, undefined],
    { nan: NaN },
    { big: Infinity },
    { '~d': 1 },
    { '~e': {} },
    { '~arr': [] },
    { '~k': '' },
    { custom: { toJSON: () => 'x' } },
    { map: new Map() },
    { invalid: new Date('invalid') },
    // eslint-disable-next-line no-sparse-arrays
    [1, , 2],
  ].forEach((input) => {
    expect(compileParseTree(input)).toBe(null);
  });
});
