/*
  Copyright 2020 Lowdefy, Inc

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

import mediaToCssObject from '../src/mediaToCssObject';

test('no object', () => {
  expect(mediaToCssObject()).toEqual({});
});

test('object with null obj to pass', () => {
  const obj = null;
  expect(mediaToCssObject(obj)).toEqual({});
});

test('object with no media unchanged', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mediaToCssObject(obj)).toEqual(obj);
});

test('object with all media', () => {
  const obj = {
    a: 'a',
    xs: { a: 'xs' },
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
    xxl: { a: 'xxl' },
  };
  expect(mediaToCssObject(obj)).toMatchInlineSnapshot(`
    Object {
      "@media screen and (max-width: 576px)": Object {
        "a": "xs",
      },
      "@media screen and (min-width: 1200px)": Object {
        "a": "xxl",
      },
      "@media screen and (min-width: 576px)": Object {
        "a": "md",
      },
      "@media screen and (min-width: 768px)": Object {
        "a": "lg",
      },
      "@media screen and (min-width: 992px)": Object {
        "a": "xl",
      },
      "a": "a",
    }
  `);
});

test('object with all media with react option', () => {
  const obj = {
    a: 'a',
    xs: { a: 'xs' },
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
    xxl: { a: 'xxl' },
  };
  expect(mediaToCssObject(obj, { react: true })).toMatchInlineSnapshot(`
    Object {
      "@media screen and (maxWidth: 576px)": Object {
        "a": "xs",
      },
      "@media screen and (minWidth: 1200px)": Object {
        "a": "xxl",
      },
      "@media screen and (minWidth: 576px)": Object {
        "a": "md",
      },
      "@media screen and (minWidth: 768px)": Object {
        "a": "lg",
      },
      "@media screen and (minWidth: 992px)": Object {
        "a": "xl",
      },
      "a": "a",
    }
  `);
});
