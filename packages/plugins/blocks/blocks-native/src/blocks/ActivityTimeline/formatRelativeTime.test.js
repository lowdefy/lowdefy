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

import formatRelativeTime from './formatRelativeTime.js';

const now = new Date(2026, 9, 18, 12, 0, 0).getTime();
const ago = (ms) => new Date(now - ms).toISOString();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

test('formatRelativeTime says just now under a minute, and for a time slightly ahead', () => {
  expect(formatRelativeTime({ at: ago(0), now })).toBe('just now');
  expect(formatRelativeTime({ at: ago(59 * 1000), now })).toBe('just now');
  expect(formatRelativeTime({ at: ago(-30 * 1000), now })).toBe('just now');
});

test('formatRelativeTime counts minutes, hours and days', () => {
  expect(formatRelativeTime({ at: ago(MINUTE), now })).toBe('1m');
  expect(formatRelativeTime({ at: ago(5 * MINUTE + 30 * 1000), now })).toBe('5m');
  expect(formatRelativeTime({ at: ago(59 * MINUTE), now })).toBe('59m');
  expect(formatRelativeTime({ at: ago(3 * HOUR), now })).toBe('3h');
  expect(formatRelativeTime({ at: ago(23 * HOUR + 59 * MINUTE), now })).toBe('23h');
  expect(formatRelativeTime({ at: ago(2 * DAY), now })).toBe('2d');
  expect(formatRelativeTime({ at: ago(6 * DAY), now })).toBe('6d');
});

test('formatRelativeTime gives the date from a week, with the year when it is another year', () => {
  expect(formatRelativeTime({ at: new Date(2026, 9, 3, 9, 0), now })).toBe('3 Oct');
  expect(formatRelativeTime({ at: new Date(2025, 11, 24, 9, 0), now })).toBe('24 Dec 2025');
});

test('formatRelativeTime takes a Date, an ISO string or a number, and gives nothing for none', () => {
  expect(formatRelativeTime({ at: new Date(now - 2 * HOUR), now })).toBe('2h');
  expect(formatRelativeTime({ at: now - 2 * HOUR, now })).toBe('2h');
  expect(formatRelativeTime({ at: null, now })).toBe('');
  expect(formatRelativeTime({ at: 'not a date', now })).toBe('');
});
