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

import mql from './mql.js';

function kind(callInfo) {
  return mql.tracking(callInfo).kind;
}

test('_mql is pure for pipelines, expressions and queries without clock or random operators', () => {
  expect(kind({ methodName: 'aggregate', params: { on: [], pipeline: [{ $match: {} }] } })).toBe(
    'pure'
  );
  expect(kind({ methodName: 'expr', params: [{}, { $add: [1, 2] }] })).toBe('pure');
  expect(kind({ methodName: 'test', params: { on: {}, test: { a: 1 } } })).toBe('pure');
});

test('_mql is volatile for $$NOW, $rand and $sample', () => {
  expect(kind({ methodName: 'expr', params: { on: {}, expr: '$$NOW' } })).toBe('volatile');
  expect(kind({ methodName: 'expr', params: [{}, { $rand: {} }] })).toBe('volatile');
  expect(
    kind({ methodName: 'aggregate', params: { on: [], pipeline: [{ $sample: { size: 1 } }] } })
  ).toBe('volatile');
});

test('_mql does not scan the data it runs on', () => {
  expect(kind({ methodName: 'aggregate', params: { on: [{ note: '$$NOW' }], pipeline: [] } })).toBe(
    'pure'
  );
});
