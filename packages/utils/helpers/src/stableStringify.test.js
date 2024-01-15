/*
  Copyright 2020-2024 Lowdefy, Inc

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

// https://github.com/substack/json-stable-stringify
import stableStringify from './stableStringify.js';

test('sort keys', () => {
  let object = {
    a: 'a',
    b: 'b',
    c: 'c',
  };
  expect(stableStringify(object)).toEqual('{"a":"a","b":"b","c":"c"}');
  object = {
    c: 'c',
    b: 'b',
    a: 'a',
  };
  expect(stableStringify(object)).toEqual('{"a":"a","b":"b","c":"c"}');
});

test('toJSON function', () => {
  const obj = {
    one: 1,
    two: 2,
    toJSON: () => {
      return { one: 1 };
    },
  };
  expect(stableStringify(obj)).toEqual('{"one":1}');
});

test('toJSON returns string', () => {
  const obj = {
    one: 1,
    two: 2,
    toJSON: () => {
      return 'one';
    },
  };
  expect(stableStringify(obj)).toEqual('"one"');
});

test('toJSON returns array', () => {
  const obj = {
    one: 1,
    two: 2,
    toJSON: () => {
      return ['one'];
    },
  };
  expect(stableStringify(obj)).toEqual('["one"]');
});

// https://github.com/epoberezkin/fast-json-stable-stableStringify/blob/master/test/str.js

test('simple object', () => {
  const obj = { c: 6, b: [4, 5], a: 3, z: null };
  expect(stableStringify(obj)).toEqual('{"a":3,"b":[4,5],"c":6,"z":null}');
});

test('object with undefined', () => {
  const obj = { a: 3, z: undefined };
  expect(stableStringify(obj)).toEqual('{"a":3}');
});

test('object with null', () => {
  const obj = { a: 3, z: null };
  expect(stableStringify(obj)).toEqual('{"a":3,"z":null}');
});

test('object with NaN and Infinity', () => {
  const obj = { a: 3, b: NaN, c: Infinity };
  expect(stableStringify(obj)).toEqual('{"a":3,"b":null,"c":null}');
});

test('array with undefined', () => {
  const obj = [4, undefined, 6];
  expect(stableStringify(obj)).toEqual('[4,null,6]');
});

test('object with empty string', () => {
  const obj = { a: 3, z: '' };
  expect(stableStringify(obj)).toEqual('{"a":3,"z":""}');
});

test('array with empty string', () => {
  const obj = [4, '', 6];
  expect(stableStringify(obj)).toEqual('[4,"",6]');
});

test('nested', () => {
  const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };
  expect(stableStringify(obj)).toEqual('{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
});

test('cyclic (default)', () => {
  const one = { a: 1 };
  const two = { a: 2, one };
  one.two = two;
  try {
    stableStringify(one);
  } catch (ex) {
    expect(ex.toString()).toEqual('TypeError: Converting circular structure to JSON');
  }
});

test('cyclic (specifically allowed)', () => {
  const one = { a: 1 };
  const two = { a: 2, one };
  one.two = two;
  expect(stableStringify(one, { cycles: true })).toEqual('{"a":1,"two":{"a":2,"one":"__cycle__"}}');
});

test('repeated non-cyclic value', () => {
  const one = { x: 1 };
  const two = { a: one, b: one };
  expect(stableStringify(two)).toEqual('{"a":{"x":1},"b":{"x":1}}');
});

test('acyclic but with reused obj-property pointers', () => {
  const x = { a: 1 };
  const y = { b: x, c: x };
  expect(stableStringify(y)).toEqual('{"b":{"a":1},"c":{"a":1}}');
});

test('custom comparison function', () => {
  const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };
  const s = stableStringify(obj, (a, b) => {
    return a.key < b.key ? 1 : -1;
  });
  expect(s).toEqual('{"c":8,"b":[{"z":6,"y":5,"x":4},7],"a":3}');
});

test('replace root', () => {
  const obj = { a: 1, b: 2, c: false };
  const replacer = () => {
    return 'one';
  };

  expect(stableStringify(obj, { replacer })).toEqual('"one"');
});

test('replace numbers', () => {
  const obj = { a: 1, b: 2, c: false };
  const replacer = (key, value) => {
    if (value === 1) return 'one';
    if (value === 2) return 'two';
    return value;
  };

  expect(stableStringify(obj, { replacer })).toEqual('{"a":"one","b":"two","c":false}');
});

test('replace with object', () => {
  const obj = { a: 1, b: 2, c: false };
  const replacer = (key, value) => {
    if (key === 'b') return { d: 1 };
    if (value === 1) return 'one';
    return value;
  };

  expect(stableStringify(obj, { replacer })).toEqual('{"a":"one","b":{"d":"one"},"c":false}');
});

test('replace with undefined', () => {
  const obj = { a: 1, b: 2, c: false };
  const replacer = (key, value) => {
    if (value === false) return undefined;
    return value;
  };

  expect(stableStringify(obj, { replacer })).toEqual('{"a":1,"b":2}');
});

test('replace with array', () => {
  const obj = { a: 1, b: 2, c: false };
  const replacer = (key, value) => {
    if (key === 'b') return ['one', 'two'];
    return value;
  };

  expect(stableStringify(obj, { replacer })).toEqual('{"a":1,"b":["one","two"],"c":false}');
});

test('replace array item', () => {
  const obj = { a: 1, b: 2, c: [1, 2] };
  const replacer = (key, value) => {
    if (value === 1) return 'one';
    if (value === 2) return 'two';
    return value;
  };

  expect(stableStringify(obj, { replacer })).toEqual('{"a":"one","b":"two","c":["one","two"]}');
});

test('space parameter', () => {
  const obj = { one: 1, two: 2 };
  expect(stableStringify(obj, { space: '  ' })).toMatchInlineSnapshot(`
    "{
      \\"one\\": 1,
      \\"two\\": 2
    }"
  `);
});

test('space parameter (with tabs)', () => {
  const obj = { one: 1, two: 2 };
  expect(stableStringify(obj, { space: '\t' })).toMatchInlineSnapshot(`
    "{
    	\\"one\\": 1,
    	\\"two\\": 2
    }"
  `);
});

test('space parameter (with a number)', () => {
  const obj = { one: 1, two: 2 };
  expect(stableStringify(obj, { space: 3 })).toMatchInlineSnapshot(`
    "{
       \\"one\\": 1,
       \\"two\\": 2
    }"
  `);
});

test('space parameter (nested objects)', () => {
  const obj = { one: 1, two: { b: 4, a: [2, 3] } };
  expect(stableStringify(obj, { space: '  ' })).toMatchInlineSnapshot(`
    "{
      \\"one\\": 1,
      \\"two\\": {
        \\"a\\": [
          2,
          3
        ],
        \\"b\\": 4
      }
    }"
  `);
});

test('space parameter (same as native)', () => {
  // for this test, properties need to be in alphabetical order
  const obj = { one: 1, two: { a: [2, 3], b: 4 } };
  expect(stableStringify(obj, { space: '  ' })).toEqual(JSON.stringify(obj, null, '  '));
});
