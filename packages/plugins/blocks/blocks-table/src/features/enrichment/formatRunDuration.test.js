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

import formatRunDuration from './formatRunDuration.js';

const at = (seconds) => new Date(Date.UTC(2026, 8, 1, 10, 0, 0) + seconds * 1000);

test('formatRunDuration shows tenths of a second under 10 seconds', () => {
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(1.2) })).toBe('1.2 s');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(0.04) })).toBe('0 s');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(2) })).toBe('2 s');
  expect(
    formatRunDuration({
      startedAt: '2026-09-01T10:00:01.000Z',
      finishedAt: '2026-09-01T10:00:03.500Z',
    })
  ).toBe('2.5 s');
});

test('formatRunDuration shows seconds, minutes and hours for longer runs', () => {
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(42.4) })).toBe('42 s');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(185) })).toBe('3 min 5 s');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(120) })).toBe('2 min');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(3720) })).toBe('1 h 2 min');
  expect(formatRunDuration({ startedAt: at(0), finishedAt: at(7200) })).toBe('2 h');
});

test('formatRunDuration returns null without both times, or for a negative duration', () => {
  expect(formatRunDuration({ startedAt: at(0), finishedAt: undefined })).toBeNull();
  expect(formatRunDuration({ startedAt: null, finishedAt: at(3) })).toBeNull();
  expect(formatRunDuration({ startedAt: 'not a date', finishedAt: at(3) })).toBeNull();
  expect(formatRunDuration({ startedAt: at(5), finishedAt: at(3) })).toBeNull();
});
