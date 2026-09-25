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

import _nunjucks from './nunjucks.js';

test('_nunjucks with a string template reads the whole of state', () => {
  expect(_nunjucks.tracking({ params: 'Hello {{ name }}' })).toEqual({
    kind: 'read',
    keys: ['state:*'],
  });
});

test('_nunjucks with a template and on is pure', () => {
  expect(_nunjucks.tracking({ params: { template: 'Hello {{ name }}', on: {} } })).toEqual({
    kind: 'pure',
  });
});

test.each([
  'Updated {{ at | date("fromNow") }}',
  "{{ due | date('isBefore') }}",
  '{{ at | date(fmt) }}',
])('_nunjucks is volatile when the date filter compares with the clock: %s', (template) => {
  expect(_nunjucks.tracking({ params: { template, on: {} } })).toEqual({ kind: 'volatile' });
  expect(_nunjucks.tracking({ params: template })).toEqual({ kind: 'volatile' });
});

test('_nunjucks with a fixed date format stays pure', () => {
  expect(
    _nunjucks.tracking({ params: { template: '{{ at | date("YYYY-MM-DD") }}', on: {} } })
  ).toEqual({ kind: 'pure' });
});
