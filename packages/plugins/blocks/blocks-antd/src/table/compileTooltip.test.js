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

import { nunjucksFunction } from '@lowdefy/nunjucks';

import compileTooltip from './compileTooltip.js';

test('compileTooltip returns null without a tooltip', () => {
  expect(compileTooltip({ tooltip: undefined, compileTemplate: nunjucksFunction })).toBeNull();
});

test('compileTooltip reads a row field', () => {
  const tooltip = compileTooltip({
    tooltip: { field: 'meta.note' },
    compileTemplate: nunjucksFunction,
  });
  expect(tooltip({ meta: { note: 'Hi' } })).toBe('Hi');
  expect(tooltip({ meta: { note: '' } })).toBeUndefined();
  expect(tooltip({})).toBeUndefined();
});

test('compileTooltip renders a template or string as plain text', () => {
  const tooltip = compileTooltip({
    tooltip: { template: '{{ row.name }}: {{ value }}' },
    compileTemplate: nunjucksFunction,
  });
  expect(tooltip({ name: 'A & B' }, '<3')).toBe('A & B: <3');
  expect(compileTooltip({ tooltip: 'Static', compileTemplate: nunjucksFunction })({}, 1)).toBe(
    'Static'
  );
  expect(
    compileTooltip({ tooltip: '{{ value }}', compileTemplate: nunjucksFunction })({}, '')
  ).toBeUndefined();
});

test('compileTooltip throws on other shapes', () => {
  expect(() =>
    compileTooltip({ tooltip: { text: 'x' }, compileTemplate: nunjucksFunction })
  ).toThrow('Table column tooltip must be a string, { field } or { template }.');
});

test('compileTooltip needs the template compiler for a template tooltip', () => {
  expect(() => compileTooltip({ tooltip: '{{ value }}' })).toThrow('compileTemplate');
  expect(compileTooltip({ tooltip: { field: 'name' } })({ name: 'Ada' })).toBe('Ada');
});
