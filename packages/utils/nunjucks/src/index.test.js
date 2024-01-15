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

import { nunjucksString, nunjucksFunction, validNunjucksString } from './index.js';

test('nunjucksString - string parsing', () => {
  expect(nunjucksString('$ {{value}}', '100')).toEqual('$ 100');
  expect(nunjucksString('$ {{value}}', 46.6)).toEqual('$ 46.6');
  expect(nunjucksString('{{value}} is a boolean', true)).toEqual('true is a boolean');
});

test('nunjucksFunction - string parsing, string value', () => {
  const temp = nunjucksFunction('$ {{value}}');
  expect(temp('100')).toEqual('$ 100');
  expect(temp(100)).toEqual('$ 100');
  expect(temp(true)).toEqual('$ true');
});

test('nunjucksFunction - string parsing, object value', () => {
  const temp = nunjucksFunction('$ {{ cost }}');
  expect(temp({ cost: '100' })).toEqual('$ 100');
  expect(temp({ cost: 100 })).toEqual('$ 100');
  expect(temp({ cost: true })).toEqual('$ true');
});

test('nunjucksString - errors', () => {
  expect(() => {
    nunjucksString('{% if a %}', {});
  }).toThrowErrorMatchingInlineSnapshot(`
"(unknown path)
  parseIf: expected elif, else, or endif, got end of file"
`);
});

test('nunjucksFunction - errors', () => {
  expect(() => {
    nunjucksFunction('{% if a %}');
  }).toThrowErrorMatchingInlineSnapshot(`
"(unknown path)
  parseIf: expected elif, else, or endif, got end of file"
`);
});

test('validNunjucksString - {% if %} single line', () => {
  expect(validNunjucksString('{% if $state.name %} true {% endif %}')).toEqual(true);
  expect(validNunjucksString('{% if $state.name %}')).toEqual(false);
});

test('validNunjucksString - {% if %} return error', () => {
  expect(validNunjucksString('{% if $state.name %} true {% endif %}', true)).toEqual(true);
  expect(validNunjucksString('{% if $state.name %}', true)).toMatchInlineSnapshot(`
    Object {
      "message": "(unknown path)
      parseIf: expected elif, else, or endif, got end of file",
      "name": "Template render error",
    }
  `);
});

test('nunjucksFunction - non-string template', () => {
  const bool = nunjucksFunction(true);
  expect(bool('100')).toEqual(true);
  const number = nunjucksFunction(100);
  expect(number('100')).toEqual(100);
  const obj = nunjucksFunction({ x: 1 });
  expect(obj('100')).toEqual({ x: 1 });
});

test('nunjucksFunction - memoization', () => {
  const func1 = nunjucksFunction('$ {{value}}');
  expect(func1('100')).toEqual('$ 100');
  const memo = nunjucksFunction('$ {{value}}');
  expect(memo('100')).toEqual('$ 100');
  expect(memo).toBe(func1);
});
