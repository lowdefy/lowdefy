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

import mediaToCssObject from './mediaToCssObject.js';

test('no object', () => {
  expect(mediaToCssObject()).toEqual([]);
});

test('object with null obj to pass', () => {
  const obj = null;
  expect(mediaToCssObject(obj)).toEqual([]);
});

test('object with no media unchanged', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mediaToCssObject(obj)).toEqual([obj]);
});

test('array of media objects passed to emotion', () => {
  const obj = [
    {
      a: 'a',
      b: 1,
      c: { a: 'b' },
    },
    {
      a: 'x',
      b: 4,
    },
  ];
  expect(mediaToCssObject(obj)).toEqual(obj);
});

test('string style definitions', () => {
  const obj = 'background-color: red;';
  expect(mediaToCssObject(obj)).toEqual(obj);
});

test('array of string style definitions', () => {
  const obj = ['background-color: red;', 'font-size: 12px;'];
  expect(mediaToCssObject(obj)).toEqual(obj);
});

test('array of mixed style definitions', () => {
  const obj = ['background-color: red;', { value: 'one' }];
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
  expect(mediaToCssObject(obj)).toMatchSnapshot();
});

test('object with all media with styleObjectOnly option', () => {
  const obj = {
    a: 'a',
    xs: { a: 'xs' },
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
    xxl: { a: 'xxl' },
  };
  expect(mediaToCssObject(obj, true)).toMatchSnapshot();
});

test('string with all media', () => {
  const obj = `{
    a: 'a',
    @media xs { a: 'xs' }
    @media sm  { a: 'sm' }
    @media md{ a: 'md' }
    @media lg { a: 'lg' }
    @media xl{ a: 'xl' }
    @media xxl  { a: 'xxl' }
  }`;
  expect(mediaToCssObject(obj)).toMatchSnapshot();
});

test('array of mixed types with all media', () => {
  const obj = [`{a: 'a', @media xs { a: 'xs' }}`, 1, true, { xl: { a: 'xl' } }];
  expect(mediaToCssObject(obj)).toEqual([
    `{a: 'a', @media screen and (max-width: 576px) { a: 'xs' }}`,
    {},
    {},
    {
      '@media screen and (min-width: 1200px)': {
        a: 'xl',
      },
    },
  ]);
});
