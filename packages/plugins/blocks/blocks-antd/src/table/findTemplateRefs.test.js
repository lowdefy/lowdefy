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
import findTemplateProblem from './findTemplateProblem.js';
import findTemplateRefs from './findTemplateRefs.js';
import renderPlaceholders from './renderPlaceholders.js';

test('findTemplateRefs gives the key a placeholder starts with, for keys with a dash too', () => {
  expect(findTemplateRefs('{{ my-col }} {{ company.name }} {{-name-}} {{ company }}')).toEqual([
    'my-col',
    'company',
    'name',
  ]);
});

test('every placeholder findTemplateProblem accepts is rendered and referenced by its first key', () => {
  const template = 'A {{ first-name }} B {{ firm.address.city }} C {{-x_1-}}';
  expect(findTemplateProblem(template)).toBeNull();
  expect(findTemplateRefs(template)).toEqual(['first-name', 'firm', 'x_1']);
  expect(
    renderPlaceholders({
      template,
      context: { 'first-name': 'Ada', firm: { address: { city: 'Cape Town' } }, x_1: 1 },
    })
  ).toBe('A Ada B Cape Town C 1');
});

test.each([
  ['{{ a | upper }}', 'is an expression'],
  ['{{ f() }}', 'is an expression'],
  ['{{ a- }}', 'is an expression'],
  ['{{ 1a }}', 'is an expression'],
  ['{{ a.b- }}', 'is an expression'],
  ['{% if a %}', 'template tags'],
])('findTemplateProblem refuses %s', (template, problem) => {
  expect(findTemplateProblem(template)).toContain(problem);
});

test('findTemplateRefs references nothing in an expression', () => {
  expect(findTemplateRefs('{{ a | upper }} {{ b }}')).toEqual(['b']);
});
