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

import mergeObjects from './mergeObjects.js';

test('object with no media unchanged', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mergeObjects(obj)).toEqual(obj);
});

test('object with no media unchanged', () => {
  const obj1 = {
    a: 'a',
    b: 1,
    c: { a: 'b', e: 1 },
  };
  const obj2 = {
    b: 2,
    c: { a: 'a' },
  };
  expect(mergeObjects([obj1, obj2])).toEqual({
    a: 'a',
    b: 2,
    c: { a: 'a', e: 1 },
  });
});

test('object with all media', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'a',
    x: 0,
    sm: { b: 1 },
    md: { a: 'md', b: 2 },
    lg: { b: 3 },
    xl: { a: 'xl', b: 4 },
  };
  expect(mergeObjects([obj1, obj2])).toMatchInlineSnapshot(`
    Object {
      "a": "a",
      "lg": Object {
        "a": "lg",
        "b": 3,
      },
      "md": Object {
        "a": "md",
        "b": 2,
      },
      "sm": Object {
        "a": "sm",
        "b": 1,
      },
      "x": 0,
      "xl": Object {
        "a": "xl",
        "b": 4,
      },
    }
  `);
});

test('merge list of objects, larger indices overwrite smaller', () => {
  expect(mergeObjects([{ a: 1 }, { sm: { b: 2 } }, { sm: { b: 4 } }, { md: { c: 2 } }]))
    .toMatchInlineSnapshot(`
    Object {
      "a": 1,
      "md": Object {
        "c": 2,
      },
      "sm": Object {
        "b": 4,
      },
    }
  `);
});

test('merge objects with null', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mergeObjects([obj, null])).toEqual(obj);
  expect(mergeObjects([null, obj])).toEqual(obj);
});
