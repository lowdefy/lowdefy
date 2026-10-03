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

import parsePsStartTime from './parsePsStartTime.js';

test('parsePsStartTime reads an lstart printed in UTC as epoch milliseconds', () => {
  expect(parsePsStartTime('Fri Oct  2 20:55:31 2026')).toEqual(Date.UTC(2026, 9, 2, 20, 55, 31));
  expect(parsePsStartTime('  Mon Jul 20 08:00:00 2026\n')).toEqual(Date.UTC(2026, 6, 20, 8, 0, 0));
});

test('parsePsStartTime returns the same instant whatever time zone its reader runs in', () => {
  const originalTz = process.env.TZ;
  try {
    process.env.TZ = 'Pacific/Auckland';
    const auckland = parsePsStartTime('Sun Mar 29 01:30:00 2026');
    process.env.TZ = 'America/New_York';
    const newYork = parsePsStartTime('Sun Mar 29 01:30:00 2026');
    expect(auckland).toEqual(Date.UTC(2026, 2, 29, 1, 30, 0));
    expect(newYork).toEqual(auckland);
  } finally {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  }
});

test('parsePsStartTime returns null for text that is not an lstart', () => {
  ['', 'Sat Oct  3 07:2', 'Fri Foo  2 20:55:31 2026', '2026-10-02T20:55:31.000Z'].forEach(
    (text) => {
      expect(parsePsStartTime(text)).toBeNull();
    }
  );
});
