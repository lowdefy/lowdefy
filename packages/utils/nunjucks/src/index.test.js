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

import {
  createEnvironment,
  nunjucksString,
  nunjucksFunction,
  validNunjucksString,
} from './index.js';

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

test('nunjucksFunction - distinct objects no longer collide', () => {
  const objA = nunjucksFunction({ x: 1 });
  const objB = nunjucksFunction({ y: 2 });
  expect(objA).not.toBe(objB);
  expect(objA('100')).toEqual({ x: 1 });
  expect(objB('100')).toEqual({ y: 2 });
});

test('nunjucksFunction - a number and its string form no longer collide', () => {
  expect(nunjucksFunction(100)('x')).toBe(100);
  expect(nunjucksFunction('100')('x')).toBe('100');
});

test('nunjucksFunction - non-string calls are not memoised', () => {
  expect(nunjucksFunction(true)).not.toBe(nunjucksFunction(true));
});

test('nunjucksFunction - memoization', () => {
  const func1 = nunjucksFunction('$ {{value}}');
  expect(func1('100')).toEqual('$ 100');
  const memo = nunjucksFunction('$ {{value}}');
  expect(memo('100')).toEqual('$ 100');
  expect(memo).toBe(func1);
});

test('nunjucksFunction - prototype collisions render literally', () => {
  expect(nunjucksFunction('toString')('x')).toBe('toString');
  expect(nunjucksFunction('constructor')('x')).toBe('constructor');
  expect(nunjucksFunction('__proto__')('x')).toBe('__proto__');
});

test('nunjucksFunction - __proto__ does not corrupt the cache', () => {
  nunjucksFunction('__proto__');
  expect(nunjucksFunction('$ {{value}}')('100')).toBe('$ 100');
});

test('nunjucksFunction - eviction is bounded to maxSize 500', () => {
  // This loop inserts 501 distinct templates, evicting nearly the whole module-level
  // cache in the process - any test declared after this one must not rely on a
  // template reference cached earlier in this file.
  const first = nunjucksFunction('t0');
  let midWindow;
  let mostRecent;
  for (let i = 1; i < 501; i++) {
    const rendered = nunjucksFunction(`t${i}`);
    if (i === 250) midWindow = rendered;
    mostRecent = rendered;
  }
  // 501 distinct templates through a cache capped at 500 evicts the first.
  expect(nunjucksFunction('t0')).not.toBe(first);
  // t250 sits well inside the 500-entry window (half of it). The check above only pins
  // an upper bound on maxSize - it would pass just as well at 100 - so this one pins a
  // lower bound: a maxSize set too low evicts t250 too.
  expect(nunjucksFunction('t250')).toBe(midWindow);
  // The most recently compiled template is still a cache hit.
  expect(nunjucksFunction('t500')).toBe(mostRecent);
});

test('createEnvironment autoescapes by default', () => {
  const env = createEnvironment();
  expect(env.renderString('{{ value }}', { value: '<b>&</b>' })).toEqual(
    '&lt;b&gt;&amp;&lt;/b&gt;'
  );
});

test('createEnvironment with autoescape false renders values verbatim', () => {
  const env = createEnvironment({ autoescape: false });
  expect(env.renderString('{{ value }}', { value: '<b>&</b>' })).toEqual('<b>&</b>');
});

test('createEnvironment registers date, unique and urlQuery filters', () => {
  const env = createEnvironment({ autoescape: false });
  expect(env.renderString('{{ items | unique | join(",") }}', { items: ['a', 'a', 'b'] })).toEqual(
    'a,b'
  );
  expect(env.renderString('{{ url | urlQuery({ a: "1" }) }}', { url: '/page' })).toEqual(
    '/page?a=1'
  );
  expect(env.getFilter('date')).toBeDefined();
});
