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

import { render } from '@testing-library/react';

import renderHtml from './renderHtml.js';
import makeCssClass from './makeCssClass.js';
const methods = {
  makeCssClass,
};

test('renderHtml html is undefined', () => {
  expect(renderHtml({ methods })).toBe(undefined);
  expect(renderHtml({ html: undefined, methods })).toBe(undefined);
});

test('renderHtml html string', () => {
  const { container } = render(renderHtml({ html: '<p>Hello</p>', methods }));
  expect(container.firstChild).toMatchSnapshot();
});

test('renderHtml html number 0', () => {
  const { container } = render(renderHtml({ html: 0, methods }));
  expect(container.firstChild).toMatchSnapshot();
});

test('renderHtml html number 123', () => {
  const { container } = render(renderHtml({ html: 123, methods }));
  expect(container.firstChild).toMatchSnapshot();
});

test('renderHtml html boolean false', () => {
  const { container } = render(renderHtml({ html: false, methods }));
  expect(container.firstChild).toMatchSnapshot();
});

test('renderHtml html boolean true', () => {
  const { container } = render(renderHtml({ html: true, methods }));
  expect(container.firstChild).toMatchSnapshot();
});
