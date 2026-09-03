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

import cronIntervalMinutes from './cronIntervalMinutes.js';

test('cronIntervalMinutes returns one minute for a every-minute schedule', () => {
  expect(cronIntervalMinutes('* * * * *')).toBe(1);
});

test('cronIntervalMinutes returns the step for a step schedule', () => {
  expect(cronIntervalMinutes('*/5 * * * *')).toBe(5);
});

test('cronIntervalMinutes returns a day for a daily schedule', () => {
  expect(cronIntervalMinutes('0 3 * * *')).toBe(1440);
});

test('cronIntervalMinutes returns a week for a weekly schedule', () => {
  expect(cronIntervalMinutes('0 3 * * 1')).toBe(7 * 1440);
});

test('cronIntervalMinutes returns the longest month for a monthly schedule', () => {
  expect(cronIntervalMinutes('30 2 1 * *')).toBe(31 * 1440);
});

test('cronIntervalMinutes returns the longest gap, not the shortest, for an uneven schedule', () => {
  // Fires at 00:00 and 01:00: the gap that matters is the 23 hours back to
  // midnight, not the hour between the two firings.
  expect(cronIntervalMinutes('0 0,1 * * *')).toBe(23 * 60);
});

test('cronIntervalMinutes handles a list of week days', () => {
  expect(cronIntervalMinutes('0 0 * * 1,3,5')).toBe(3 * 1440);
});

test('cronIntervalMinutes returns null when the schedule never fires twice in a year', () => {
  expect(cronIntervalMinutes('0 0 30 2 *')).toBe(null);
});

test('cronIntervalMinutes returns null for an expression without five fields', () => {
  expect(cronIntervalMinutes('0 0 *')).toBe(null);
});
