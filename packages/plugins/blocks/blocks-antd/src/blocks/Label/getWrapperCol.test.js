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

import getWrapperCol from './getWrapperCol.js';

test('with inline', () => {
  expect(getWrapperCol({}, true)).toEqual({ flex: '1 1 auto' });
});

test('with no span value', () => {
  expect(getWrapperCol({}, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
  });
});

test('with a span value', () => {
  expect(getWrapperCol({ span: 3 }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 21 },
  });
});

test('with a xs span value', () => {
  expect(getWrapperCol({ xs: { span: 3 } }, false)).toEqual({
    xs: { span: 21 },
    sm: { span: 24 },
  });
});

test('with a sm span value', () => {
  expect(getWrapperCol({ sm: { span: 3 } }, false)).toEqual({
    xs: { span: 21 },
    sm: { span: 21 },
  });
});

test('with a md span value', () => {
  expect(getWrapperCol({ md: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 21 },
  });
});

test('with a lg span value', () => {
  expect(getWrapperCol({ lg: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    lg: { span: 21 },
  });
});

test('with a xl span value', () => {
  expect(getWrapperCol({ xl: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    xl: { span: 21 },
  });
});

test('with a xxl span value', () => {
  expect(getWrapperCol({ xxl: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    xxl: { span: 21 },
  });
});

test('with all desktop span values', () => {
  expect(
    getWrapperCol({ md: { span: 1 }, lg: { span: 2 }, xl: { span: 3 }, xxl: { span: 4 } }, false)
  ).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 23 },
    lg: { span: 22 },
    xl: { span: 21 },
    xxl: { span: 20 },
  });
});

test('with all mobile span values', () => {
  expect(getWrapperCol({ xs: { span: 1 }, sm: { span: 2 } }, false)).toEqual({
    xs: { span: 23 },
    sm: { span: 22 },
  });
});

test('with all span values', () => {
  expect(
    getWrapperCol(
      {
        xs: { span: 11 },
        sm: { span: 22 },
        md: { span: 1 },
        lg: { span: 2 },
        xl: { span: 3 },
        xxl: { span: 4 },
      },
      false
    )
  ).toEqual({
    xs: { span: 13 },
    sm: { span: 2 },
    md: { span: 23 },
    lg: { span: 22 },
    xl: { span: 21 },
    xxl: { span: 20 },
  });
});
