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

import { LRUCache } from '@lowdefy/helpers';

import createRenderFunction from './createRenderFunction.js';
import SlotExtension from './SlotExtension.js';
import { createEnvironment, createTemplateFunction, nunjucksFunction } from './index.js';

test('createRenderFunction returns the same render function for the same source', () => {
  const render = createRenderFunction({
    environment: createEnvironment(),
    cache: new LRUCache({ maxSize: 10 }),
  });
  expect(render('{{ value }}')).toBe(render('{{ value }}'));
  expect(render('{{ value }}')).not.toBe(render('{{ value }}!'));
});

test('createRenderFunction evicts the least recently used template', () => {
  const cache = new LRUCache({ maxSize: 2 });
  const render = createRenderFunction({ environment: createEnvironment(), cache });
  const a = render('a {{ value }}');
  const b = render('b {{ value }}');
  // "a" is used again, so "b" becomes the least recently used entry.
  expect(render('a {{ value }}')).toBe(a);
  render('c {{ value }}');
  expect(render('a {{ value }}')).toBe(a);
  expect(render('b {{ value }}')).not.toBe(b);
  expect(render('a {{ value }}')('x')).toEqual('a x');
});

test('createRenderFunction surfaces a syntax error when the template is compiled', () => {
  const render = createRenderFunction({
    environment: createEnvironment(),
    cache: new LRUCache({ maxSize: 10 }),
  });
  expect(() => render('{% if a %}')).toThrow(/expected elif, else, or endif/);
});

test('createRenderFunction does not render the template while compiling it', () => {
  // A filter that throws on an absent value is a property of the data, not a
  // defect in the template - compiling it must not fail.
  const render = createRenderFunction({
    environment: createEnvironment(),
    cache: new LRUCache({ maxSize: 10 }),
  });
  expect(() => render('{{ rows | unique }}')).not.toThrow();
  expect(render('{{ rows | unique }}')({ rows: ['a', 'a', 'b'] })).toEqual('a,b');
});

test('createRenderFunction returns non-string templates as themselves', () => {
  const render = createRenderFunction({
    environment: createEnvironment(),
    cache: new LRUCache({ maxSize: 10 }),
  });
  expect(render(5)()).toBe(5);
  expect(render(null)()).toBe(null);
});

test('the Template environment knows {% slot %} and the general one does not', () => {
  expect(createTemplateFunction('{% slot "footer" %}')({})).toEqual(
    '<div data-ldf-slot="footer"></div>'
  );
  expect(() => nunjucksFunction('{% slot "footer" %}')).toThrow(/unknown block tag: slot/);
});

test('the two surfaces do not share a cache', () => {
  const source = '{{ value }}';
  expect(createTemplateFunction(source)).not.toBe(nunjucksFunction(source));
});

test('SlotExtension escapes markup characters in the slot name', () => {
  const environment = createEnvironment();
  environment.addExtension('SlotExtension', new SlotExtension());
  const render = createRenderFunction({ environment, cache: new LRUCache({ maxSize: 10 }) });
  expect(render('{% slot "a<b&c\\"d" %}')({})).toEqual(
    '<div data-ldf-slot="a&lt;b&amp;c&quot;d"></div>'
  );
});
