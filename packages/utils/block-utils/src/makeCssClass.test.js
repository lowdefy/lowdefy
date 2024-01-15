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

import React from 'react';
import makeCssClass from './makeCssClass.js';
import { render } from '@testing-library/react';

test('object with no media', () => {
  const cls = makeCssClass({
    a: 'a',
    b: 1,
    c: { a: 'b' },
  });
  const { container } = render(<div className={cls} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('objects with no media', () => {
  const obj1 = {
    a: 'a',
    c: { a: 'b', d: 1 },
  };
  const obj2 = {
    c: { a: 'c' },
  };
  const { container } = render(<div className={makeCssClass([obj1, obj2])} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('objects with media', () => {
  const obj = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const { container } = render(<div className={makeCssClass(obj)} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('objects with media', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'x',
    sm: { a: 'smsm' },
    md: { a: 'md' },
    lg: { a: 'lg', c: { sm: { a: '1' } } },
    xl: { a: 'xl' },
  };
  const { container } = render(<div className={makeCssClass([obj1, obj2])} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('object with no media, styleObjectOnly', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(makeCssClass(obj, { styleObjectOnly: true })).toMatchSnapshot();
});

test('objects with no media, styleObjectOnly', () => {
  const obj1 = {
    a: 'a',
    c: { a: 'b', d: 1 },
  };
  const obj2 = {
    c: { a: 'c' },
  };
  expect(makeCssClass([obj1, obj2], { styleObjectOnly: true })).toMatchSnapshot();
});

test('objects with media, styleObjectOnly', () => {
  const obj = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  expect(makeCssClass(obj, { styleObjectOnly: true })).toMatchSnapshot();
});

test('objects with media, styleObjectOnly', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'x',
    sm: { a: 'smsm' },
    md: { a: 'md' },
    lg: { a: 'lg', c: { sm: { a: '1' } } },
    xl: { a: 'xl' },
  };
  expect(makeCssClass([obj1, obj2], { styleObjectOnly: true })).toMatchSnapshot();
});
