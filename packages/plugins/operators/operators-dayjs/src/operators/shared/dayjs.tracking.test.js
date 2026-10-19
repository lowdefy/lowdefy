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

import _dayjs from './dayjs.js';

function kind(callInfo) {
  return _dayjs.tracking(callInfo).kind;
}

test('_dayjs chain mode starting from now is volatile', () => {
  expect(kind({ params: ['now', 'toISOString'] })).toBe('volatile');
  expect(kind({ params: [null, 'toISOString'] })).toBe('volatile');
});

test('_dayjs chain mode on a date with locale-free steps is pure', () => {
  expect(
    kind({ params: ['2024-01-01', { add: [1, 'day'] }, { startOf: 'month' }, 'toISOString'] })
  ).toBe('pure');
  expect(kind({ params: ['2024-01-01', { diff: ['2023-01-01', 'day'] }] })).toBe('pure');
  expect(kind({ params: ['2024-01-01', { locale: 'fr' }, 'toISOString'] })).toBe('pure');
});

test('_dayjs chain steps that read the global locale or the clock are volatile', () => {
  expect(kind({ params: ['2024-01-01', 'format'] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', { format: 'MMMM' }] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', 'fromNow'] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', { to: '2025-01-01' }] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', 'week'] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', { startOf: 'week' }] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', 'isBefore'] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', { diff: [] }] })).toBe('volatile');
  expect(kind({ params: ['2024-01-01', 'locale'] })).toBe('volatile');
});

test('_dayjs.format is volatile only without a date', () => {
  expect(kind({ methodName: 'format', params: { format: 'YYYY' } })).toBe('volatile');
  expect(kind({ methodName: 'format', params: { on: '2024-01-01', format: 'YYYY' } })).toBe('pure');
  expect(kind({ methodName: 'format', params: ['2024-01-01', 'en', 'YYYY'] })).toBe('pure');
});

test('_dayjs.humanizeDuration is pure', () => {
  expect(kind({ methodName: 'humanizeDuration', params: { on: 1000 } })).toBe('pure');
});
