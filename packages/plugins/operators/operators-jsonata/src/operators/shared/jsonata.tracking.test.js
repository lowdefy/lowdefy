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

import _jsonata from './jsonata.js';

function kind(callInfo) {
  return _jsonata.tracking(callInfo).kind;
}

test('_jsonata is pure for expressions without clock or random functions', () => {
  expect(kind({ params: { on: {}, expr: '$sum(items.price)' } })).toBe('pure');
  expect(kind({ methodName: 'evaluate', params: [{}, 'a.b'] })).toBe('pure');
});

test('_jsonata is volatile for $now, $millis and $random', () => {
  expect(kind({ params: { on: {}, expr: '$now()' } })).toBe('volatile');
  expect(kind({ params: [{}, '$millis()'] })).toBe('volatile');
  expect(kind({ params: { on: {}, expr: '$random() > 0.5' } })).toBe('volatile');
});
