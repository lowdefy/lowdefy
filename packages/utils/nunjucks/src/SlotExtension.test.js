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

import nunjucks from 'nunjucks';
import SlotExtension from './SlotExtension.js';

function render(source, context = {}) {
  const env = new nunjucks.Environment(null, { autoescape: true });
  env.addExtension('SlotExtension', new SlotExtension());
  return env.renderString(source, context);
}

test('slot tag renders a data-ldf-slot marker element', () => {
  expect(render('{% slot "footer" %}')).toEqual('<div data-ldf-slot="footer"></div>');
});

test('slot tag output is not autoescaped', () => {
  expect(render('<p>{% slot "a" %}</p>')).toEqual('<p><div data-ldf-slot="a"></div></p>');
});

test('slot tag accepts single quoted names', () => {
  expect(render("{% slot 'x' %}")).toEqual('<div data-ldf-slot="x"></div>');
});

test('slot tag escapes quotes in the slot name attribute', () => {
  expect(render("{% slot 'a\"b' %}")).toEqual('<div data-ldf-slot="a&quot;b"></div>');
});

test('slot tag throws a compile error naming the tag when the name is unquoted', () => {
  expect(() => render('{% slot footer %}')).toThrow(
    'slot tag expects a quoted slot name, for example {% slot "footer" %}.'
  );
});

test('slot tag throws a compile error when the name is missing', () => {
  expect(() => render('{% slot %}')).toThrow('slot tag expects a quoted slot name');
});

test('slot tag throws a compile error when the name is a number', () => {
  expect(() => render('{% slot 1 %}')).toThrow('slot tag expects a quoted slot name');
});
