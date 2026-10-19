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

import _cron from './cron.js';

function kind(callInfo) {
  return _cron.tracking(callInfo).kind;
}

test('_cron.next and _cron.previous from now are volatile', () => {
  expect(kind({ methodName: 'next', params: '0 9 * * *' })).toBe('volatile');
  expect(kind({ methodName: 'previous', params: { expression: '0 9 * * *' } })).toBe('volatile');
});

test('_cron.next and _cron.previous from a date are pure', () => {
  expect(
    kind({ methodName: 'next', params: { expression: '0 9 * * *', from: '2024-01-01' } })
  ).toBe('pure');
  expect(
    kind({ methodName: 'previous', params: { expression: '0 9 * * *', from: new Date(0) } })
  ).toBe('pure');
});

test('_cron.describe, validate and fields are pure', () => {
  expect(kind({ methodName: 'describe', params: '0 9 * * *' })).toBe('pure');
  expect(kind({ methodName: 'validate', params: '0 9 * * *' })).toBe('pure');
  expect(kind({ methodName: 'fields', params: '0 9 * * *' })).toBe('pure');
});
