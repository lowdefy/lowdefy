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

import getOperatorType from './getOperatorType.js';

test('getOperatorType returns the operator name for an operator object', () => {
  expect(getOperatorType({ _state: 'key' })).toBe('_state');
});

test('getOperatorType normalizes method form to the base operator', () => {
  expect(getOperatorType({ '_get.key': {} })).toBe('_get');
  expect(getOperatorType({ '_string.concat': [] })).toBe('_string');
});

test('getOperatorType normalizes escaped multi-underscore operators', () => {
  expect(getOperatorType({ __state: 'key' })).toBe('_state');
  expect(getOperatorType({ ___args: 0 })).toBe('_args');
});

test('getOperatorType ignores ~ prefixed keys alongside the operator key', () => {
  expect(getOperatorType({ _state: 'key', '~k': 'a1' })).toBe('_state');
});

test('getOperatorType returns null for non-operator values', () => {
  expect(getOperatorType({ a: 1 })).toBe(null);
  expect(getOperatorType({ _state: 'key', other: 1 })).toBe(null);
  expect(getOperatorType({ _id: 'x' })).toBe(null);
  expect(getOperatorType({ _: 'too short' })).toBe(null);
  expect(getOperatorType({})).toBe(null);
  expect(getOperatorType('_state')).toBe(null);
  expect(getOperatorType(['_state'])).toBe(null);
  expect(getOperatorType(null)).toBe(null);
});
