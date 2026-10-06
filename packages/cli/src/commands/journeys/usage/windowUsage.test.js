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

import windowUsage from './windowUsage.js';

const months = [
  { month: '2026-06', days: 30, sessions: 600, persons: 50, orgs: 9, failures: 6 },
  { month: '2026-09', days: 30, sessions: 300, persons: 30, orgs: 9, failures: 3 },
  { month: '2026-10', days: 3, sessions: 30, persons: 11, orgs: 5, failures: 1 },
];

test('windowUsage sums sessions, failures and days inside the window and gives the rate', () => {
  expect(windowUsage({ months, windowMonths: ['2026-08', '2026-09', '2026-10'] })).toEqual({
    sessions: 330,
    failures: 4,
    days: 33,
    rate: 10,
  });
});

test('windowUsage gives rate 0 with no days in the window', () => {
  expect(windowUsage({ months, windowMonths: ['2027-01'] })).toEqual({
    sessions: 0,
    failures: 0,
    days: 0,
    rate: 0,
  });
  expect(windowUsage({ months: undefined, windowMonths: ['2026-10'] }).rate).toBe(0);
});
