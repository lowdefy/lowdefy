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

import parseSince from './parseSince.js';

const NOW = Date.parse('2026-10-06T12:00:00.000Z');

test('parseSince reads a duration back from now', () => {
  expect(parseSince({ since: '30m', now: NOW })).toEqual(NOW - 30 * 60 * 1000);
  expect(parseSince({ since: '2h', now: NOW })).toEqual(NOW - 2 * 60 * 60 * 1000);
  expect(parseSince({ since: '7d', now: NOW })).toEqual(NOW - 7 * 24 * 60 * 60 * 1000);
});

test('parseSince reads an ISO date', () => {
  expect(parseSince({ since: '2026-10-01', now: NOW })).toEqual(Date.parse('2026-10-01'));
});

test('parseSince throws on a value that is neither a duration nor a date', () => {
  expect(() => parseSince({ since: 'last week', now: NOW })).toThrow(
    '--since takes a duration such as 30m, 2h or 7d, or an ISO date. Received "last week".'
  );
});
